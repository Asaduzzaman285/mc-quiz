<?php

namespace App\Http\Controllers;

use App\Traits\ApiResponser;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    use ApiResponser;

    public function getAllRoles()
    {
        $roles = Role::all();
        return $this->set_response($roles, 200, 'success', ['Roles list.']);
    }

    public function getAllPermissions()
    {
        $permissions = Permission::all();
        return $this->set_response($permissions, 200, 'success', ['Permissions list.']);
    }

    public function getRole($id)
    {
        $role = Role::with('permissions')->find($id);
        if (!$role) {
            return $this->set_response(null, 404, 'error', ['Role not found.']);
        }
        return $this->set_response($role, 200, 'success', ['Role details.']);
    }
}
