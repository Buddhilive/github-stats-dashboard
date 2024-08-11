import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GithubUserProfile } from '../../shared/constants/github-user.interface';

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.scss',
})
export class UserDetailsComponent {
  @Input() data!: GithubUserProfile;
}
