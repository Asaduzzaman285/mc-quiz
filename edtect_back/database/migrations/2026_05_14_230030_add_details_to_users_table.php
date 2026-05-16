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
        Schema::table('users', function (Blueprint $table) {
            $table->tinyInteger('status')->default(1)->after('email');
            $table->string('avatar')->nullable()->after('name');
            $table->string('phone')->nullable()->after('status');
            $table->string('division')->nullable()->after('phone');
            $table->string('district')->nullable()->after('division');
            $table->string('subscription_status')->default('inactive')->after('district');
            $table->date('subscription_expiry')->nullable()->after('subscription_status');
            $table->date('joining_date')->nullable()->after('subscription_expiry');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['division', 'district', 'avatar', 'subscription_status', 'subscription_expiry']);
        });
    }
};
