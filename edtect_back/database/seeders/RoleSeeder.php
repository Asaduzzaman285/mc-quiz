<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $roles = ['admin', 'student', 'teacher'];
        $guards = ['web', 'api'];

        foreach ($guards as $guard) {
            foreach ($roles as $roleName) {
                Role::findOrCreate($roleName, $guard);
            }
        }
    }
}
