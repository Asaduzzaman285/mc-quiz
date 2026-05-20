<?php

namespace App\Http\Controllers;

use Exception;
use Carbon\Carbon;
use App\Models\User;
use App\Traits\Queries;
use App\Rules\PhoneRule;
use App\Traits\ApiResponser;
use Illuminate\Http\Request;
use Laravel\Passport\Passport;
use App\Models\OauthAccessToken;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    use ApiResponser, Queries;

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email|max:255',
            'password' => 'required|string|min:8',
        ]);
        if ($validator->fails()) {
            return $this->set_response(null, 422, 'failed', $validator->errors()->all());
        }

        if (!Auth::attempt($request->only('email', 'password'))) {
            return $this->set_response(null, 422, 'failed', ['Credentials mismatch']);
        }

        $user = Auth::user();
        $personalAccessToken = $this->getPersonalAccessToken();

        // Ensure role exists (Self-healing)
        \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);
        \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'student', 'guard_name' => 'api']);

        $tokenData = $this->formatUserData($user, $personalAccessToken);

        return $this->set_response($tokenData, 200, 'success', ['Logged in!']);
    }

    public function signup(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string',
            'email' => 'required|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'phone' => ['nullable', new PhoneRule],
            'division' => 'nullable|string',
            'district' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->set_response(null, 422, 'failed', $validator->errors()->all());
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt($request->password),
            'phone' => $request->phone,
            'division' => $request->division,
            'district' => $request->district,
            'status' => 1,
            'joining_date' => now()->toDateString(),
        ]);

        // Ensure role exists (Self-healing)
        \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);
        \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'student', 'guard_name' => 'api']);

        // Assign role on BOTH guards so it works regardless of context
        $user->assignRole(\Spatie\Permission\Models\Role::where('name', 'student')->where('guard_name', 'api')->first());

        Auth::login($user);

        $personalAccessToken = $this->getPersonalAccessToken();
        $tokenData = $this->formatUserData($user, $personalAccessToken);

        return $this->set_response($tokenData, 200, 'success', ['User Created!']);
    }

    public function me(Request $request)
    {
        $user = Auth::user();
        $tokenData = $this->formatUserData($user);

        return $this->set_response($tokenData, 200, 'success', ['My data.']);
    }

    public function logout()
    {
        $user = Auth::user();
        $user->token()->revoke();

        OauthAccessToken::where('user_id', $user->id)
                            ->update([
                                'revoked' => 1
                            ]);

        return $this->set_response(null, 200, 'success', ['User Logged Out!']);
    }

    protected function formatUserData($user, $personalAccessToken = null)
    {
        $user_roles_permissions = $this->user_roles_permissions_q();
        $roles = $user_roles_permissions->where('user_id', $user->id)->pluck('role_name')->unique()->toArray();
        $permissions = $user_roles_permissions->where('user_id', $user->id)->pluck('permission_name')->unique()->toArray();

        // Calculate stats for frontend
        $totalQuizzes = $user->quizResults()->count();
        $totalCorrect = $user->quizResults()->sum('correct_answers');
        $totalQuestions = $user->quizResults()->sum('total_questions');
        $accuracy = $totalQuestions > 0 ? round(($totalCorrect / $totalQuestions) * 100) : 0;

        $userData = [
            'userId' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'avatar' => $user->avatar ?: substr($user->name, 0, 1),
            'division' => $user->division,
            'district' => $user->district,
            'subscriptionStatus' => $user->subscription_status,
            'subscriptionExpiry' => $user->subscription_expiry ? $user->subscription_expiry->format('F d, Y') : null,
            'totalQuizzes' => $totalQuizzes,
            'totalCorrect' => $totalCorrect,
            'accuracy' => $accuracy,
            'roles' => $user->getRoleNames(),
            'permissions' => $user->getAllPermissions()->pluck('name'),
            'quizHistory' => $user->quizResults()->with('quiz')->latest()->limit(5)->get()->map(function($result) {
                return [
                    'month'   => optional($result->quiz)->date ? $result->quiz->date->format('F Y') : '—',
                    'score'   => $result->score,
                    'rank'    => $result->rank,
                    'correct' => $result->correct_answers,
                    'total'   => $result->total_questions,
                    'timeSec' => $result->completion_time,
                ];
            })
        ];

        if ($personalAccessToken) {
            $userData['access_token'] = $personalAccessToken->accessToken;
            $userData['token_type'] = 'Bearer';
            $userData['expires_at'] = Carbon::parse($personalAccessToken->token->expires_at)->toDateTimeString();
        }

        return [
            'user' => $userData,
            'roles' => $roles,
            'permissions' => $permissions,
        ];
    }

    protected function getPersonalAccessToken()
    {
        if (request()->remember_me == true) {
            Passport::personalAccessTokensExpireIn(now()->addDays(15));
        }
        return Auth::user()->createToken('Personal Access Token');
    }

    public function profileUpdate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'nullable|string',
            'phone' => ['nullable', new PhoneRule],
            'division' => 'nullable|string',
            'district' => 'nullable|string',
            'current_password' => 'nullable|string|min:8',
            'new_password' => [
                'required_with:current_password',
                'different:current_password',
                'string',
                'min:8',
                'regex:/[a-z]/',
                'regex:/[A-Z]/',
                'regex:/[0-9]/',
                'regex:/[@$!%*#?&]/',
            ],
            'new_confirm_password' => 'required_with:new_password|same:new_password|string|min:8',
        ], [
            'new_password.regex' => "New password must contain at least one upper case, lower case letter, one number and one special character."
        ]);

        if ($validator->fails()) {
            return $this->set_response(null, 422, 'error', $validator->errors()->all());
        }

        DB::beginTransaction();
        try {
            $user = User::find(auth()->user()->id);
            $user->update($request->only(['name', 'phone', 'division', 'district']));

            if ($request->current_password) {
                if (Hash::check($request->current_password, $user->password)) {
                    $user->update([
                        'password' => bcrypt($request->new_password),
                        'force_password' => 0
                    ]);
                } else {
                    throw new Exception("Invalid current password given!");
                }
            }

            DB::commit();
            return $this->set_response($this->formatUserData($user), 200, 'success', ['Profile successfully updated!']);
        } catch (\Exception $e) {
            DB::rollback();
            return $this->set_response(null, 400, 'error', [$e->getMessage()]);
        }
    }

    public function userList()
    {
        // Get all users who are NOT admin — includes users with student role
        // and users with no role yet (registered before role fix)
        $adminIds = \DB::table('model_has_roles')
            ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
            ->where('roles.name', 'admin')
            ->pluck('model_has_roles.model_id')
            ->toArray();

        $users = User::whereNotIn('id', $adminIds)
            ->latest()
            ->get()
            ->map(function ($user) {
                return [
                    'id'                  => $user->id,
                    'name'                => $user->name,
                    'email'               => $user->email,
                    'phone'               => $user->phone,
                    'division'            => $user->division,
                    'district'            => $user->district,
                    'subscription_status' => $user->subscription_status,
                    'joining_date'        => $user->joining_date,
                    'created_at'          => $user->created_at?->format('Y-m-d H:i'),
                ];
            });

        return $this->set_response($users, 200, 'success', ['Students list.']);
    }
}
