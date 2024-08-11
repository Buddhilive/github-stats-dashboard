import { Component, inject, Input, OnChanges } from '@angular/core';
import { GithubStatsService } from '../../shared/services/github-stats.service';
import { catchError, forkJoin } from 'rxjs';
import { ChartModule } from 'primeng/chart';
import { GithubLanguageCount, GithubLanguageData } from '../../shared/constants/language-data.interface';
import { TableModule } from 'primeng/table';
import { LangstatTabledata } from '../../shared/constants/langstat-tabledata.interface';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-language-stats',
  standalone: true,
  imports: [
    CommonModule,
    ChartModule,
    TableModule,
    ProgressSpinnerModule,
    CardModule
  ],
  templateUrl: './language-stats.component.html',
  styleUrl: './language-stats.component.scss'
})
export class LanguageStatsComponent implements OnChanges {
  @Input() repoData!: Array<any>;
  private githubStatsService = inject(GithubStatsService);
  chartData: any;
  languageStats!: GithubLanguageData;
  tableData!: Array<LangstatTabledata>

  ngOnChanges(): void {
    this.fetchLanguageStats();
  }

  fetchLanguageStats() {
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
    let groupedData: GithubLanguageCount = data.reduce((acc, curr) => {
      Object.entries(curr).forEach(([key, value]) => {
        acc[key] = (acc[key] || 0) + value;
      });
      return acc;
    }, {});

    groupedData = this.sortObjectByValueDescending(groupedData);

    const totalSum = Object.values(groupedData).reduce((acc, val) => acc + val, 0);
    this.languageStats = {
      totalLines: totalSum,
      languageData: groupedData
    }
    this.chartData = this.formatDataForChart(groupedData);
    this.formatDataForTable(groupedData);

    return { groupedData, totalSum };
  }

  private formatDataForChart(groupedData: GithubLanguageCount) {
    const labels = Object.keys(groupedData);
    const data = Object.values(groupedData);

    return {
      labels: labels.slice(0, 10),
      datasets: [{
        label: 'Top 10 Languages',
        data: data.slice(0, 10),
        backgroundColor: Array.from({ length: 10 }, () => `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`)
      }]
    };
  }

  private sortObjectByValueDescending(obj: Object) {
    const entries = Object.entries(obj);
    entries.sort((a, b) => b[1] - a[1]);
  
    return Object.fromEntries(entries);
  }

  private formatDataForTable(groupedData: GithubLanguageCount) {
    this.tableData = [];
    for (let key in groupedData) {
      const rowData: LangstatTabledata = {
        name: key,
        lines: groupedData[key]
      };
      this.tableData.push(rowData);
    }
  }
}
