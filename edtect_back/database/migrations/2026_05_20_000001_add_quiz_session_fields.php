<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add quiz_sessions table for tracking active quiz attempts
        if (!Schema::hasTable('quiz_sessions')) {
            Schema::create('quiz_sessions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->foreignId('quiz_id')->constrained()->onDelete('cascade');
                $table->timestamp('started_at')->nullable();
                $table->timestamp('submitted_at')->nullable();
                $table->integer('total_answered')->default(0);
                $table->integer('correct_count')->default(0);
                $table->integer('time_taken_seconds')->nullable();
                $table->enum('status', ['in_progress', 'submitted', 'timed_out'])->default('in_progress');
                $table->timestamps();
            });
        }

        // Add rank column to user_quiz_results if missing
        if (!Schema::hasColumn('user_quiz_results', 'rank')) {
            Schema::table('user_quiz_results', function (Blueprint $table) {
                $table->integer('rank')->nullable()->after('completion_time');
            });
        }

        // Add prize column to user_quiz_results if missing
        if (!Schema::hasColumn('user_quiz_results', 'prize')) {
            Schema::table('user_quiz_results', function (Blueprint $table) {
                $table->decimal('prize', 10, 2)->nullable()->after('rank');
            });
        }

        // Add questions_count to quizzes if missing
        if (!Schema::hasColumn('quizzes', 'questions_count')) {
            Schema::table('quizzes', function (Blueprint $table) {
                $table->integer('questions_count')->default(0)->after('duration_minutes');
            });
        }

        // Add status to quizzes if missing
        if (!Schema::hasColumn('quizzes', 'status')) {
            Schema::table('quizzes', function (Blueprint $table) {
                $table->enum('status', ['upcoming', 'ongoing', 'completed'])->default('upcoming')->after('questions_count');
            });
        }

        // Add prize_pool to quizzes if missing
        if (!Schema::hasColumn('quizzes', 'prize_pool')) {
            Schema::table('quizzes', function (Blueprint $table) {
                $table->decimal('prize_pool', 12, 2)->default(0)->after('status');
            });
        }

        // Add title to quizzes if missing
        if (!Schema::hasColumn('quizzes', 'title')) {
            Schema::table('quizzes', function (Blueprint $table) {
                $table->string('title')->nullable()->after('name');
            });
        }

        // Add time column to quizzes if missing
        if (!Schema::hasColumn('quizzes', 'time')) {
            Schema::table('quizzes', function (Blueprint $table) {
                $table->string('time')->nullable()->after('date');
            });
        }

        // Add duration column to quizzes if missing
        if (!Schema::hasColumn('quizzes', 'duration')) {
            Schema::table('quizzes', function (Blueprint $table) {
                $table->integer('duration')->default(3)->after('time');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_sessions');
    }
};
