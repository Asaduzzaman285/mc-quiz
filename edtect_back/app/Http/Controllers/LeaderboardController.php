<?php

namespace App\Http\Controllers;

use App\Models\UserQuizResult;
use App\Models\Quiz;
use App\Traits\ApiResponser;
use Illuminate\Http\Request;

class LeaderboardController extends Controller
{
    use ApiResponser;

    public function index(Request $request)
    {
        $quizId = $request->query('quiz_id');

        if (!$quizId) {
            // Default: the quiz that has the most recent submission
            // This ensures we always show the active/latest competed quiz
            $latestResult = UserQuizResult::orderBy('created_at', 'desc')->first();
            if ($latestResult) {
                $quizId = $latestResult->quiz_id;
            } else {
                // No submissions yet — use the quiz with the most questions
                $quiz = Quiz::where('questions_count', '>', 0)->orderBy('id', 'desc')->first()
                    ?? Quiz::orderBy('id', 'desc')->first();
                $quizId = $quiz?->id;
            }
        }

        if (!$quizId) {
            return $this->set_response([], 200, 'success', ['No quiz data available yet.']);
        }

        // Fetch ALL results for this quiz, ranked by score desc then time asc
        $results = UserQuizResult::with('user')
            ->where('quiz_id', $quizId)
            ->orderBy('correct_answers', 'desc')
            ->orderBy('completion_time', 'asc')
            ->get()
            ->map(function ($item, $index) {
                $name        = $item->user->name ?? 'Unknown';
                $firstName   = explode(' ', trim($name))[0];
                $displayName = $firstName . ' • ' . ($item->user->district ?? 'BD');

                return [
                    'rank'               => $index + 1,
                    'name'               => $displayName,
                    'display_name'       => $displayName,
                    'district'           => $item->user->district ?? '-',
                    'score'              => $item->correct_answers,
                    'correct_count'      => $item->correct_answers,
                    'time_taken_seconds' => $item->completion_time,
                    'prize'              => $this->getPrize($index + 1),
                    'avatar'             => strtoupper(substr($name, 0, 2)),
                    'quiz_id'            => $item->quiz_id,
                ];
            });

        return $this->set_response($results, 200, 'success', ['Leaderboard data.']);
    }

    private function getPrize(int $rank): string
    {
        $prizes = [
            1  => '৳ ১৫,০০০',
            2  => '৳ ৫,০০০',
            3  => '৳ ১,০০০',
            4  => '৳ ১,০০০',
            5  => '৳ ১,০০০',
            6  => '৳ ১,০০০',
            7  => '৳ ১,০০০',
            8  => '৳ ১,০০০',
            9  => '৳ ১,০০০',
            10 => '৳ ১,০০০',
        ];
        return $prizes[$rank] ?? '—';
    }
}
