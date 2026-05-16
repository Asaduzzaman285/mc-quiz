<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Fix magazines table
        Schema::table('magazines', function (Blueprint $table) {
            if (!Schema::hasColumn('magazines', 'pdf_path')) {
                $table->string('pdf_path')->nullable()->after('color');
            }
            if (!Schema::hasColumn('magazines', 'image')) {
                $table->string('image')->nullable()->after('pdf_path');
            }
        });

        // Fix quizzes table
        Schema::table('quizzes', function (Blueprint $table) {
            if (!Schema::hasColumn('quizzes', 'name')) {
                $table->string('name')->after('id');
            }
            if (!Schema::hasColumn('quizzes', 'deadline')) {
                $table->dateTime('deadline')->nullable()->after('date');
            }
            if (!Schema::hasColumn('quizzes', 'resultDate')) {
                $table->string('resultDate')->nullable()->after('deadline');
            }
            if (!Schema::hasColumn('quizzes', 'total_marks')) {
                $table->integer('total_marks')->default(0)->after('resultDate');
            }
            if (!Schema::hasColumn('quizzes', 'duration_minutes')) {
                $table->integer('duration_minutes')->default(0)->after('total_marks');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('magazines', function (Blueprint $table) {
            $table->dropColumn(['pdf_path', 'image']);
        });

        Schema::table('quizzes', function (Blueprint $table) {
            $table->dropColumn(['name', 'deadline', 'resultDate', 'total_marks', 'duration_minutes']);
        });
    }
};
