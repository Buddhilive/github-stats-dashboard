import { ChangeDetectionStrategy, Component, inject, Input, OnInit } from '@angular/core';
import { GithubStatsService } from '../../shared/services/github-stats.service';
import { catchError, forkJoin } from 'rxjs';
import { ChartModule } from 'primeng/chart';

@Component({
  selector: 'app-language-stats',
  standalone: true,
  imports: [ChartModule],
  templateUrl: './language-stats.component.html',
  styleUrl: './language-stats.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LanguageStatsComponent implements OnInit {
  @Input() repoData!: Array<any>;
  private githubStatsService = inject(GithubStatsService);
  chartData: any;

  ngOnInit(): void {
    this.fetchLanguageStats();
  }

  fetchLanguageStats() {
    this.repoData = JSON.parse(localStorage.getItem('github-stats-repos')!);
    const languageStatsObservables = this.repoData.map((repo: any) =>
      this.githubStatsService.getRepoLanguageStats(repo.languages_url).pipe(
        catchError((error) => {
          console.error(`Failed to fetch language stats for repo: ${repo.name}`, error);
          return [];
        })
      )
    );

    forkJoin(languageStatsObservables).subscribe(
      (repoLanguageData: Array<any>) => {
        localStorage.setItem('github-stats-repos-lan', JSON.stringify(repoLanguageData));
        const allLangSummary = this.sumByKeyAndTotal(repoLanguageData);
        localStorage.setItem('github-stats-lan-summary', JSON.stringify(allLangSummary));
      },
      (error) => console.error('An error occurred while fetching language stats', error)
    );
  }

  private sumByKeyAndTotal(data: Array<any>) {
    const groupedData: Object = data.reduce((acc, curr) => {
      Object.entries(curr).forEach(([key, value]) => {
        acc[key] = (acc[key] || 0) + value;
      });
      return acc;
    }, {});

    const totalSum = Object.values(groupedData).reduce((acc, val) => acc + val, 0);
    this.chartData = this.formatDataForChart(groupedData);

    return { groupedData, totalSum };
  }

  private formatDataForChart(groupedData: Object) {
    const labels = Object.keys(groupedData);
    const data = Object.values(groupedData);

    return {
      labels,
      datasets: [{
        label: 'Data',
        data,
        backgroundColor: Array.from({ length: labels.length }, () => `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`)
      }]
    };
  }
}
