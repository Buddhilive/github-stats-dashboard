export interface GithubLanguageData {
    totalLines: number,
    languageData: GithubLanguageCount
}

export interface GithubLanguageCount {
    [key: string]: number
}