<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\Question;
use App\Models\QuizSession;
use App\Models\UserQuizResult;
use App\Models\MagazinePurchase;
use App\Traits\ApiResponser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class QuizController extends Controller
{
    use ApiResponser;

    // ─── Public / User Routes ────────────────────────────────────────────────

    public function index()
    {
        $quizzes = Quiz::with('magazine')->latest()->get()->map(function ($quiz) {
            return $this->formatQuiz($quiz);
        });
        return $this->set_response($quizzes, 200, 'success', ['Quizzes list.']);
    }

    public function show($id)
    {
        $quiz = Quiz::with(['questions', 'magazine'])->find($id);
        if (!$quiz) {
            return $this->set_response(null, 404, 'failed', ['Quiz not found.']);
        }
        return $this->set_response($this->formatQuiz($quiz), 200, 'success', ['Quiz data.']);
    }

    public function activeQuiz()
    {
        $quiz = Quiz::with('magazine')
            ->where(function ($q) {
                $q->where('deadline', '>=', now()->toDateString())
                  ->orWhereNull('deadline');
            })
            ->orderBy('id', 'desc')
            ->first();

        if (!$quiz) {
            $quiz = Quiz::with('magazine')->latest()->first();
        }

        return $this->set_response($quiz ? $this->formatQuiz($quiz) : null, 200, 'success', ['Active quiz data.']);
    }

    /**
     * Start a quiz session — returns shuffled questions WITHOUT correct_option
     */
    public function start(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'quiz_id' => 'required|exists:quizzes,id',
        ]);
        if ($validator->fails()) {
            return $this->set_response(null, 422, 'failed', $validator->errors()->all());
        }

        $user = auth()->user();
        $quiz = Quiz::with('questions')->find($request->quiz_id);

        // Guard 1: Must have purchased the linked magazine
        if ($quiz->magazine_id) {
            $purchase = MagazinePurchase::where('user_id', $user->id)
                ->where('magazine_id', $quiz->magazine_id)
                ->where('payment_status', 'completed')
                ->first();
            if (!$purchase) {
                return $this->set_response(null, 403, 'failed', ['Purchase required. Please buy the magazine first.']);
            }
        }

        // Guard 2: No existing in-progress session
        $existing = QuizSession::where('user_id', $user->id)
            ->where('quiz_id', $quiz->id)
            ->where('status', 'in_progress')
            ->first();

        if ($existing) {
            // Check if it's still within time window (3 min = 180s)
            $elapsed = abs(now()->diffInSeconds($existing->started_at));
            if ($elapsed < 180) {
                // Resume existing session
                $questions = $quiz->questions
                    ->map(fn($q) => $this->formatQuestionForFrontend($q))
                    ->shuffle()
                    ->values();

                return $this->set_response([
                    'session_id'       => $existing->id,
                    'questions'        => $questions,
                    'duration_seconds' => 180,
                    'started_at'       => $existing->started_at,
                    'time_remaining'   => 180 - $elapsed,
                    'resumed'          => true,
                ], 200, 'success', ['Resuming existing session.']);
            } else {
                // Timed out — mark it
                $existing->update(['status' => 'timed_out']);
            }
        }

        // Guard 3: Already submitted
        $submitted = UserQuizResult::where('user_id', $user->id)
            ->where('quiz_id', $quiz->id)
            ->first();
        if ($submitted) {
            return $this->set_response(null, 400, 'failed', ['You have already submitted this quiz.']);
        }

        // Shuffle questions, strip correct_option
        $questions = $quiz->questions
            ->map(fn($q) => $this->formatQuestionForFrontend($q))
            ->shuffle()
            ->values();

        // Create session
        $session = QuizSession::create([
            'user_id'    => $user->id,
            'quiz_id'    => $quiz->id,
            'started_at' => now(),
            'status'     => 'in_progress',
        ]);

        return $this->set_response([
            'session_id'       => $session->id,
            'questions'        => $questions,
            'duration_seconds' => 180,
            'started_at'       => $session->started_at,
            'time_remaining'   => 180,
            'resumed'          => false,
        ], 200, 'success', ['Quiz started.']);
    }

    /**
     * Submit quiz answers — validates session, scores, saves result
     */
    public function submit(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'session_id'   => 'required|exists:quiz_sessions,id',
            'answers'      => 'required|array',
            'answers.*.question_id'     => 'required|exists:questions,id',
            'answers.*.selected_option' => 'required|integer|min:0|max:3',
        ]);
        if ($validator->fails()) {
            return $this->set_response(null, 422, 'failed', $validator->errors()->all());
        }

        $user = auth()->user();

        // Find session belonging to this user
        $session = QuizSession::where('id', $request->session_id)
            ->where('user_id', $user->id)
            ->where('status', 'in_progress')
            ->first();

        if (!$session) {
            return $this->set_response(null, 404, 'failed', ['Session not found or already submitted.']);
        }

        // Check time limit (180 seconds) — use abs() to handle timezone edge cases
        $elapsed = abs(now()->diffInSeconds($session->started_at));
        if ($elapsed > 200) { // 20s grace period
            $session->update(['status' => 'timed_out']);
            return $this->set_response(null, 422, 'failed', ['Quiz time has expired.']);
        }

        $timeTaken = min(180, $elapsed);

        // Load correct answers
        $questionIds = collect($request->answers)->pluck('question_id');
        $correctAnswers = Question::whereIn('id', $questionIds)
            ->pluck('correct_option', 'id');

        // Score
        $correctCount = 0;
        foreach ($request->answers as $answer) {
            if (isset($correctAnswers[$answer['question_id']]) &&
                (int)$answer['selected_option'] === (int)$correctAnswers[$answer['question_id']]) {
                $correctCount++;
            }
        }

        $totalAnswered = count($request->answers);
        $accuracyPct   = $totalAnswered > 0 ? round(($correctCount / $totalAnswered) * 100, 2) : 0;

        DB::beginTransaction();
        try {
            // Update session
            $session->update([
                'status'             => 'submitted',
                'submitted_at'       => now(),
                'correct_count'      => $correctCount,
                'total_answered'     => $totalAnswered,
                'time_taken_seconds' => $timeTaken,
            ]);

            // Save result
            $result = UserQuizResult::create([
                'user_id'          => $user->id,
                'quiz_id'          => $session->quiz_id,
                'score'            => $correctCount,
                'correct_answers'  => $correctCount,
                'total_questions'  => $totalAnswered,
                'completion_time'  => $timeTaken,
            ]);

            // Recalculate ranks for this quiz
            $this->recalculateRanks($session->quiz_id);

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->set_response(null, 500, 'error', [$e->getMessage()]);
        }

        // Winning probability
        $totalSessions = UserQuizResult::where('quiz_id', $session->quiz_id)->count();
        $worseSessions = UserQuizResult::where('quiz_id', $session->quiz_id)
            ->where(function ($q) use ($correctCount, $timeTaken) {
                $q->where('correct_answers', '<', $correctCount)
                  ->orWhere(function ($q2) use ($correctCount, $timeTaken) {
                      $q2->where('correct_answers', $correctCount)
                         ->where('completion_time', '>', $timeTaken);
                  });
            })->count();

        $winningProbability = $totalSessions > 0
            ? round(($worseSessions / $totalSessions) * 100, 2)
            : 100.0;

        // Comparison with previous quiz
        $prevResult = UserQuizResult::where('user_id', $user->id)
            ->where('quiz_id', '!=', $session->quiz_id)
            ->latest()
            ->first();

        $comparison = ['has_previous' => false];
        if ($prevResult && $prevResult->total_questions > 0) {
            $prevAccuracy = round(($prevResult->correct_answers / $prevResult->total_questions) * 100, 2);
            $comparison = [
                'has_previous'             => true,
                'time_delta_seconds'       => $prevResult->completion_time - $timeTaken,
                'accuracy_delta_percentage'=> $accuracyPct - $prevAccuracy,
            ];
        }

        $quiz = Quiz::find($session->quiz_id);

        return $this->set_response([
            'time_taken_seconds'  => $timeTaken,
            'correct_count'       => $correctCount,
            'total_answered'      => $totalAnswered,
            'accuracy_percentage' => $accuracyPct,
            'winning_probability' => $winningProbability,
            'comparison'          => $comparison,
            'result_publish_date' => $quiz->resultDate ?? now()->addDays(3)->toDateString(),
        ], 200, 'success', ['Quiz submitted successfully.']);
    }

    /**
     * Legacy submit endpoint (kept for backward compatibility with old frontend)
     */
    public function submitLegacy(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'score'            => 'required|integer',
            'correct_answers'  => 'required|integer',
            'total_questions'  => 'required|integer',
            'completion_time'  => 'required|integer',
        ]);
        if ($validator->fails()) {
            return $this->set_response(null, 422, 'failed', $validator->errors()->all());
        }

        $user = auth()->user();
        $quiz = Quiz::find($id);
        if (!$quiz) {
            return $this->set_response(null, 404, 'failed', ['Quiz not found.']);
        }

        // Check purchase
        if ($quiz->magazine_id) {
            $purchase = MagazinePurchase::where('user_id', $user->id)
                ->where('magazine_id', $quiz->magazine_id)
                ->where('payment_status', 'completed')
                ->first();
            if (!$purchase) {
                return $this->set_response(null, 403, 'failed', ['Purchase required.']);
            }
        }

        // Check duplicate
        $existing = UserQuizResult::where('user_id', $user->id)->where('quiz_id', $quiz->id)->first();
        if ($existing) {
            return $this->set_response(null, 400, 'failed', ['Already submitted.']);
        }

        $result = UserQuizResult::create([
            'user_id'         => $user->id,
            'quiz_id'         => $quiz->id,
            'score'           => $request->score,
            'correct_answers' => $request->correct_answers,
            'total_questions' => $request->total_questions,
            'completion_time' => $request->completion_time,
        ]);

        $this->recalculateRanks($quiz->id);

        return $this->set_response($result, 200, 'success', ['Quiz results submitted successfully.']);
    }

    // ─── Admin Routes ────────────────────────────────────────────────────────

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'             => 'required|string',
            'magazine_id'      => 'nullable|exists:magazines,id',
            'date'             => 'required|date',
            'deadline'         => 'required|date',
            'resultDate'       => 'required|string',
            'total_marks'      => 'required|integer',
            'duration_minutes' => 'required|integer',
        ]);
        if ($validator->fails()) {
            return $this->set_response(null, 422, 'failed', $validator->errors()->all());
        }

        $quiz = Quiz::create($request->only([
            'name', 'title', 'magazine_id', 'date', 'deadline',
            'resultDate', 'total_marks', 'duration_minutes'
        ]));

        return $this->set_response($this->formatQuiz($quiz), 201, 'success', ['Quiz created successfully.']);
    }

    public function uploadQuestions(Request $request, $id)
    {
        $quiz = Quiz::find($id);
        if (!$quiz) {
            return $this->set_response(null, 404, 'failed', ['Quiz not found.']);
        }

        $validator = Validator::make($request->all(), [
            // Accept csv, txt, and also application/vnd.ms-excel (Windows CSV MIME)
            'file' => 'required|file|max:5120',
        ]);
        if ($validator->fails()) {
            return $this->set_response(null, 422, 'failed', $validator->errors()->all());
        }

        $file    = $request->file('file');
        $content = file_get_contents($file->getRealPath());

        // Normalise line endings: \r\n and \r → \n
        $content = str_replace(["\r\n", "\r"], "\n", $content);

        // Split into lines manually — more reliable than fgetcsv on all platforms
        $lines = explode("\n", $content);

        // Skip header row (first line)
        array_shift($lines);

        $count   = 0;
        $rows    = [];
        $skipped = 0;

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '') continue; // skip blank lines

            // Parse CSV line — handle quoted fields
            $data = str_getcsv($line);

            if (count($data) < 6) {
                $skipped++;
                continue;
            }

            $correctIdx = (int) trim($data[5]);
            if ($correctIdx < 0 || $correctIdx > 3) {
                $skipped++;
                continue;
            }

            $rows[] = [
                'quiz_id'        => $quiz->id,
                'question_text'  => trim($data[0]),
                'options'        => json_encode([
                    trim($data[1]),
                    trim($data[2]),
                    trim($data[3]),
                    trim($data[4]),
                ]),
                'correct_option' => $correctIdx,
                'category'       => isset($data[6]) ? trim($data[6]) : 'General',
                'created_at'     => now(),
                'updated_at'     => now(),
            ];
            $count++;
        }

        if ($count > 0) {
            Question::where('quiz_id', $quiz->id)->delete();
            foreach (array_chunk($rows, 100) as $chunk) {
                Question::insert($chunk);
            }
            $quiz->update(['questions_count' => $count]);
        }

        return $this->set_response(
            ['count' => $count, 'skipped' => $skipped],
            200,
            'success',
            ["{$count} questions uploaded successfully." . ($skipped > 0 ? " ({$skipped} rows skipped)" : '')]
        );
    }

    // ─── Leaderboard for a specific quiz ─────────────────────────────────────

    public function leaderboard($quizId)
    {
        $results = UserQuizResult::with('user')
            ->where('quiz_id', $quizId)
            ->orderBy('correct_answers', 'desc')
            ->orderBy('completion_time', 'asc')
            ->take(50)
            ->get()
            ->map(function ($item, $index) {
                $name  = $item->user->name ?? 'Unknown';
                $parts = explode(' ', $name);
                $displayName = $parts[0] . ' • ' . ($item->user->district ?? 'BD');
                return [
                    'rank'                => $index + 1,
                    'display_name'        => $displayName,
                    'district'            => $item->user->district ?? '-',
                    'score'               => $item->correct_answers,
                    'correct_count'       => $item->correct_answers,
                    'time_taken_seconds'  => $item->completion_time,
                    'prize'               => $this->getPrize($index + 1),
                    'avatar'              => strtoupper(substr($name, 0, 2)),
                ];
            });

        return $this->set_response($results, 200, 'success', ['Leaderboard data.']);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function formatQuiz(Quiz $quiz): array
    {
        $data = $quiz->toArray();
        $data['questions_count'] = $quiz->questions()->count();
        return $data;
    }

    private function formatQuestionForFrontend(Question $q): array
    {
        return [
            'id'            => $q->id,
            'question_text' => $q->question_text,
            'options'       => $q->options,
            'category'      => $q->category,
            // correct_option intentionally omitted
        ];
    }

    private function recalculateRanks(int $quizId): void
    {
        $results = UserQuizResult::where('quiz_id', $quizId)
            ->orderBy('correct_answers', 'desc')
            ->orderBy('completion_time', 'asc')
            ->get();

        foreach ($results as $index => $result) {
            $result->update(['rank' => $index + 1]);
        }
    }

    private function getPrize(int $rank): string
    {
        $prizes = [
            1 => '৳ ১৫,০০০', 2 => '৳ ৫,০০০', 3 => '৳ ১,০০০',
            4 => '৳ ১,০০০',  5 => '৳ ১,০০০',  6 => '৳ ১,০০০',
            7 => '৳ ১,০০০',  8 => '৳ ১,০০০',  9 => '৳ ১,০০০', 10 => '৳ ১,০০০',
        ];
        return $prizes[$rank] ?? '—';
    }
}
