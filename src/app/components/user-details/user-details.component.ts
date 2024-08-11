import { Component, Input } from '@angular/core';
import { GithubUserProfile } from '../../shared/constants/github-user.interface';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [CardModule],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.scss',
})
export class UserDetailsComponent {
  @Input() data!: GithubUserProfile;
}
