<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create Permissions
        $permissions = [
            'manage-magazines',
            'manage-quizzes',
            'view-reports',
            'manage-users',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'api']);
        }

        // Create Roles
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);
        $studentRole = Role::firstOrCreate(['name' => 'student', 'guard_name' => 'api']);

        // Give all permissions to admin
        $adminRole->syncPermissions(Permission::all());

        // Create Admin User
        $admin = User::firstOrCreate(
            ['email' => 'admin@mcquiz.com'],
            [
                'name' => 'Admin User',
                'password' => bcrypt('password'),
                'status' => 1,
                'joining_date' => now()->toDateString(),
            ]
        );

        $admin->assignRole($adminRole);
    }
}
