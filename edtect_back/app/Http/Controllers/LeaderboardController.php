<?php

namespace App\Http\Controllers;

use App\Models\UserQuizResult;
use App\Traits\ApiResponser;
use Illuminate\Http\Request;

class LeaderboardController extends Controller
{
    use ApiResponser;

    public function index(Request $request)
    {
        $quizId = $request->query('quiz_id');

        $query = UserQuizResult::with('user')
            ->orderBy('score', 'desc')
            ->orderBy('completion_time', 'asc');

        if ($quizId) {
            $query->where('quiz_id', $quizId);
        }

        $leaderboard = $query->take(50)->get()->map(function($item, $index) {
            return [
                'rank' => $index + 1,
                'name' => $item->user->name ?? 'Unknown',
                'district' => $item->user->district ?? '-',
                'score' => $item->score,
                'prize' => $item->prize ?? '—',
                'avatar' => strtoupper(substr($item->user->name ?? '?', 0, 1))
            ];
        });

        return $this->set_response($leaderboard, 200, 'success', ['Leaderboard data.']);
    }
}
