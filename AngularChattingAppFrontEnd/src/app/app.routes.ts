import { Routes } from '@angular/router';
import { MemberList } from '../Members/member-list/member-list';
import { MemberDetail } from '../Members/member-detail/member-detail';
import { Messages } from '../messages/messages';
import { Lists } from '../lists/lists';
import { Home } from '../home/home';
import { AdminComponent } from '../admin/admin';
import { AuthGuard } from '../_guards/auth.guard';
import { AdminGuard } from '../_guards/admin.guard';
import { NotFoundComponent } from './not-found.component';
import { ServerErrorComponent } from './server-error.component';
import { BuggyComponenet } from '../buggy-componenet/buggy-componenet';
import { ProfileComponent } from './profile.component';
import { EditProfileComponent } from './edit-profile.component';
import { MessagesResolver } from '../_services/messages.resolver';
import { ResetPasswordComponent } from '../reset-password/reset-password';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    component: Home,
  },
  {
    path: 'members',
    component: MemberList,
    canActivate: [AuthGuard],
  },
  {
    path: 'member/:id',
    component: MemberDetail,
    canActivate: [AuthGuard],
  },
  {
    path: 'messages',
    component: Messages,
    canActivate: [AuthGuard],
    canDeactivate: [
      (component: Messages) => {
        // Prevent deactivation if component is still loading
        if (component && !component.isInitialized) {
          return false;
        }
        return true;
      },
    ],
    resolve: { data: MessagesResolver },
  },
  {
    path: 'lists',
    component: Lists,
    canActivate: [AuthGuard],
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [AdminGuard],
  },
  {
    path: 'server-error',
    component: ServerErrorComponent,
  },
  {
    path: 'not-found',
    component: NotFoundComponent,
  },
  {
    path: 'buggy-test',
    component: BuggyComponenet,
    canActivate: [AdminGuard],
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'edit-profile',
    component: EditProfileComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
  },
  {
    path: '**',
    component: NotFoundComponent,
  },
];
