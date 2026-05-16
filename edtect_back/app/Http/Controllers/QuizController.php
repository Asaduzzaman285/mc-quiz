<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\UserQuizResult;
use App\Traits\ApiResponser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class QuizController extends Controller
{
    use ApiResponser;

    public function index()
    {
        $quizzes = Quiz::with('magazine')->latest()->get();
        return $this->set_response($quizzes, 200, 'success', ['Quizzes list.']);
    }

    public function show($id)
    {
        $quiz = Quiz::with(['questions', 'magazine'])->find($id);
        if (!$quiz) {
            return $this->set_response(null, 404, 'failed', ['Quiz not found.']);
        }
        return $this->set_response($quiz, 200, 'success', ['Quiz data.']);
    }

    public function activeQuiz()
    {
        // Get the latest quiz that hasn't passed its deadline
        $quiz = Quiz::with('magazine')
            ->where('deadline', '>', now())
            ->orderBy('date', 'desc')
            ->first();

        if (!$quiz) {
            // Fallback to the absolute latest quiz if none are active
            $quiz = Quiz::with('magazine')->latest()->first();
        }

        return $this->set_response($quiz, 200, 'success', ['Active quiz data.']);
    }

    public function submit(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'score' => 'required|integer',
            'correct_answers' => 'required|integer',
            'total_questions' => 'required|integer',
            'completion_time' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return $this->set_response(null, 422, 'failed', $validator->errors()->all());
        }

        $user = auth()->user();
        $quiz = Quiz::with('magazine')->find($id);

        if (!$quiz) {
            return $this->set_response(null, 404, 'failed', ['Quiz not found.']);
        }

        // Check if user has purchased the magazine linked to this quiz
        $purchase = \App\Models\MagazinePurchase::where('user_id', $user->id)
            ->where('magazine_id', $quiz->magazine_id)
            ->where('payment_status', 'completed')
            ->first();

        if (!$purchase) {
            return $this->set_response(null, 403, 'failed', ['You must purchase the linked magazine to participate in this quiz.']);
        }

        // Check if already submitted
        $existing = UserQuizResult::where('user_id', $user->id)
            ->where('quiz_id', $quiz->id)
            ->first();

        if ($existing) {
            return $this->set_response(null, 400, 'failed', ['You have already submitted this quiz.']);
        }

        $result = UserQuizResult::create([
            'user_id' => $user->id,
            'quiz_id' => $quiz->id,
            'score' => $request->score,
            'correct_answers' => $request->correct_answers,
            'total_questions' => $request->total_questions,
            'completion_time' => $request->completion_time,
        ]);

        return $this->set_response($result, 200, 'success', ['Quiz results submitted successfully.']);
    }
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string',
            'magazine_id' => 'nullable|exists:magazines,id',
            'date' => 'required|date',
            'deadline' => 'required|date',
            'resultDate' => 'required|string',
            'total_marks' => 'required|integer',
            'duration_minutes' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return $this->set_response(null, 422, 'failed', $validator->errors()->all());
        }

        $quiz = Quiz::create($request->all());
        return $this->set_response($quiz, 201, 'success', ['Quiz created successfully.']);
    }

    public function uploadQuestions(Request $request, $id)
    {
        $quiz = Quiz::find($id);
        if (!$quiz) {
            return $this->set_response(null, 404, 'failed', ['Quiz not found.']);
        }

        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:csv,txt',
        ]);

        if ($validator->fails()) {
            return $this->set_response(null, 422, 'failed', $validator->errors()->all());
        }

        $file = $request->file('file');
        $handle = fopen($file->getRealPath(), 'r');
        
        // Skip header
        fgetcsv($handle);

        $count = 0;
        while (($data = fgetcsv($handle)) !== false) {
            // Expected format: question_text, opt1, opt2, opt3, opt4, correct_index, category
            if (count($data) >= 7) {
                \App\Models\Question::create([
                    'quiz_id' => $quiz->id,
                    'question_text' => $data[0],
                    'options' => [$data[1], $data[2], $data[3], $data[4]],
                    'correct_option' => (int)$data[5],
                    'category' => $data[6],
                ]);
                $count++;
            }
        }
        fclose($handle);

        return $this->set_response(['count' => $count], 200, 'success', ["$count questions uploaded successfully."]);
    }
}
