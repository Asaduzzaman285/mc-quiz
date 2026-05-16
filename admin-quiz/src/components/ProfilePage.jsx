import React, { useState, useEffect } from 'react';
import { FaHome, FaUser, FaLock, FaSave } from 'react-icons/fa';
import Swal from 'sweetalert2';
import Spinner from './Spinner';

const ProfilePage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        const token = localStorage.getItem('authToken');
        try {
            const res = await fetch(`${import.meta.env.VITE_APP_API_BASE_URL}/api/v1/me`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const data = await res.json();
            if (data.status === 'success') {
                const user = data.data.user;
                setName(user.name || '');
                setEmail(user.email || '');
            }
        } catch (err) {
            console.error('fetchProfileData error', err);
        } finally {
            setPageLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        
        if (newPassword && newPassword !== confirmPassword) {
            showAlert('Passwords do not match', 'warning');
            return;
        }

        setLoading(true);
        const token = localStorage.getItem('authToken');
        const payload = {
            name,
            email,
            current_password: currentPassword || null,
            new_password: newPassword || null,
            new_confirm_password: confirmPassword || null
        };

        try {
            const res = await fetch(`${import.meta.env.VITE_APP_API_BASE_URL}/api/v1/profileUpdate`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok && data.status === 'success') {
                showAlert('Profile updated successfully', 'success');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                // Update local storage if name changed
                localStorage.setItem('userName', name);
            } else {
                const errorMsg = data.errors ? data.errors[0] : (data.message || 'Failed to update profile');
                showAlert(errorMsg, 'danger');
            }
        } catch (err) {
            console.error('handleUpdateProfile error', err);
            showAlert('Something went wrong', 'danger');
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (message, variant = 'success') => {
        Swal.fire({
            icon: variant === 'danger' ? 'error' : variant,
            title: variant === 'success' ? 'Success!' : 'Error!',
            text: message,
            showConfirmButton: false,
            timer: 3000,
            toast: true,
            position: 'top-end',
            timerProgressBar: true
        });
    };

    if (pageLoading) return <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}><Spinner /></div>;

    return (
        <div className="container-fluid px-4 mt-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h3 mb-0 text-gray-800">My Profile</h1>
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb mb-0">
                        <li className="breadcrumb-item"><FaHome className="me-1" /> Home</li>
                        <li className="breadcrumb-item active">Profile</li>
                    </ol>
                </nav>
            </div>

            <div className="row">
                <div className="col-xl-4 col-lg-5">
                    <div className="card shadow mb-4">
                        <div className="card-body text-center">
                            <div className="mb-3">
                                <div className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center text-white" style={{ width: '100px', height: '100px', fontSize: '40px' }}>
                                    {name.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <h5 className="font-weight-bold">{name}</h5>
                            <p className="text-muted small mb-1">{email}</p>
                            <span className="badge bg-success">Active Account</span>
                        </div>
                    </div>
                </div>

                <div className="col-xl-8 col-lg-7">
                    <div className="card shadow mb-4">
                        <div className="card-header py-3 d-flex align-items-center">
                            <FaUser className="me-2 text-primary" />
                            <h6 className="m-0 font-weight-bold text-primary">Edit Profile Information</h6>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleUpdateProfile}>
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label small font-weight-bold">Full Name</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            value={name} 
                                            onChange={(e) => setName(e.target.value)} 
                                            required 
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small font-weight-bold">Email Address</label>
                                        <input 
                                            type="email" 
                                            className="form-control" 
                                            value={email} 
                                            onChange={(e) => setEmail(e.target.value)}
                                            required 
                                        />
                                    </div>
                                </div>
                                <div className="row mb-4">
                                </div>

                                <hr className="my-4" />

                                <div className="d-flex align-items-center mb-3">
                                    <FaLock className="me-2 text-primary" />
                                    <h6 className="m-0 font-weight-bold text-primary">Security & Password</h6>
                                </div>
                                <p className="text-muted small mb-3">Leave password fields empty if you don't want to change it.</p>

                                <div className="row mb-3">
                                    <div className="col-md-12">
                                        <label className="form-label small font-weight-bold">Current Password</label>
                                        <input 
                                            type="password" 
                                            className="form-control" 
                                            value={currentPassword} 
                                            onChange={(e) => setCurrentPassword(e.target.value)} 
                                            placeholder="Enter current password to verify"
                                        />
                                    </div>
                                </div>
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label small font-weight-bold">New Password</label>
                                        <input 
                                            type="password" 
                                            className="form-control" 
                                            value={newPassword} 
                                            onChange={(e) => setNewPassword(e.target.value)} 
                                            placeholder="Min 8 characters"
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small font-weight-bold">Confirm New Password</label>
                                        <input 
                                            type="password" 
                                            className="form-control" 
                                            value={confirmPassword} 
                                            onChange={(e) => setConfirmPassword(e.target.value)} 
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 text-end">
                                    <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                                        {loading ? <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> : <FaSave className="me-2" />}
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
