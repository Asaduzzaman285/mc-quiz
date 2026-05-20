import React from 'react';
import Homepage from '../components/Homepage';
import UserPage from '../components/UserPage';
import RoleListPage from '../components/RoleListPage';
import CreateRolePage from '../components/CreateRolePage';
import MagazineManager from '../components/MagazineManager';
import QuizManager from '../components/QuizManager';
import ProfilePage from '../components/ProfilePage';
import LeaderboardPage from '../components/LeaderboardPage';
import PurchasesPage from '../components/PurchasesPage';

const routes = [
    { path: '/admin/profile', exact: true, name: 'ProfilePage', component: (props) => <ProfilePage {...props} /> },
    { path: '/admin/home', exact: true, name: 'Homepage', component: (props) => <Homepage {...props} /> },
    { path: '/admin/role', exact: true, name: 'RoleListPage', component: (props) => <RoleListPage {...props} /> },
    { path: '/admin/roles/create', exact: true, name: 'CreateRolePage', component: (props) => <CreateRolePage {...props} /> },
    { path: '/admin/user', exact: true, name: 'UserPage', component: (props) => <UserPage {...props} /> },
    { path: '/admin/magazines', exact: true, name: 'MagazineManager', component: (props) => <MagazineManager {...props} /> },
    { path: '/admin/quizzes', exact: true, name: 'QuizManager', component: (props) => <QuizManager {...props} /> },
    { path: '/admin/leaderboard', exact: true, name: 'LeaderboardPage', component: (props) => <LeaderboardPage {...props} /> },
    { path: '/admin/purchases', exact: true, name: 'PurchasesPage', component: (props) => <PurchasesPage {...props} /> },
];

export default routes;