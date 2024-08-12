/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = require("@nestjs/common");

/***/ }),
/* 2 */
/***/ ((module) => {

module.exports = require("@nestjs/core");

/***/ }),
/* 3 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppModule = void 0;
const tslib_1 = __webpack_require__(4);
const common_1 = __webpack_require__(1);
const axios_1 = __webpack_require__(5);
const config_1 = __webpack_require__(6);
const serve_static_1 = __webpack_require__(7);
const path_1 = __webpack_require__(8);
const app_controller_1 = __webpack_require__(9);
const app_service_1 = __webpack_require__(10);
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [
            axios_1.HttpModule,
            config_1.ConfigModule.forRoot({
                isGlobal: true
            }),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', 'client/browser'),
                exclude: ['api/*']
            })
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);


/***/ }),
/* 4 */
/***/ ((module) => {

module.exports = require("tslib");

/***/ }),
/* 5 */
/***/ ((module) => {

module.exports = require("@nestjs/axios");

/***/ }),
/* 6 */
/***/ ((module) => {

module.exports = require("@nestjs/config");

/***/ }),
/* 7 */
/***/ ((module) => {

module.exports = require("@nestjs/serve-static");

/***/ }),
/* 8 */
/***/ ((module) => {

module.exports = require("path");

/***/ }),
/* 9 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppController = void 0;
const tslib_1 = __webpack_require__(4);
const common_1 = __webpack_require__(1);
const app_service_1 = __webpack_require__(10);
const rxjs_1 = __webpack_require__(11);
const repo_details_dto_1 = __webpack_require__(12);
let AppController = class AppController {
    constructor(appService) {
        this.appService = appService;
    }
    async getData(username) {
        return await (0, rxjs_1.lastValueFrom)(this.appService.getUserInfo(username));
    }
    async getUserRepos(username) {
        return await (0, rxjs_1.lastValueFrom)(this.appService.getUserRepos(username));
    }
    async getRepoLanguageData(repoDetails) {
        return await (0, rxjs_1.lastValueFrom)(this.appService.getRepoLanguagesStats(repoDetails.language_url));
    }
};
exports.AppController = AppController;
tslib_1.__decorate([
    (0, common_1.Get)('/:username'),
    tslib_1.__param(0, (0, common_1.Param)('username')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", typeof (_b = typeof Promise !== "undefined" && Promise) === "function" ? _b : Object)
], AppController.prototype, "getData", null);
tslib_1.__decorate([
    (0, common_1.Get)('repos/:username'),
    tslib_1.__param(0, (0, common_1.Param)('username')),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], AppController.prototype, "getUserRepos", null);
tslib_1.__decorate([
    (0, common_1.Post)('lang'),
    tslib_1.__param(0, (0, common_1.Body)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_d = typeof repo_details_dto_1.RepoDetailsDTO !== "undefined" && repo_details_dto_1.RepoDetailsDTO) === "function" ? _d : Object]),
    tslib_1.__metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], AppController.prototype, "getRepoLanguageData", null);
exports.AppController = AppController = tslib_1.__decorate([
    (0, common_1.Controller)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof app_service_1.AppService !== "undefined" && app_service_1.AppService) === "function" ? _a : Object])
], AppController);


/***/ }),
/* 10 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppService = void 0;
const tslib_1 = __webpack_require__(4);
const common_1 = __webpack_require__(1);
const axios_1 = __webpack_require__(5);
const rxjs_1 = __webpack_require__(11);
const config_1 = __webpack_require__(6);
let AppService = class AppService {
    constructor(httpClient, _configService) {
        this.httpClient = httpClient;
        this._configService = _configService;
        this.BASE_URL = 'https://api.github.com/';
        this.headers = {};
        this.headers = {
            Authorization: 'token ' + _configService.get('GITHUB_AUTH_TOKEN')
        };
    }
    getUserInfo(username) {
        return this.httpClient.get(this.BASE_URL + 'users/' + username, {
            headers: this.headers
        }).pipe((0, rxjs_1.map)((response) => response.data));
    }
    getUserRepos(username) {
        return this.httpClient.get(this.BASE_URL + 'users/' + username + '/repos?per_page=100', {
            headers: this.headers
        }).pipe((0, rxjs_1.map)((response) => response.data));
    }
    getRepoLanguagesStats(languagesUrl) {
        return this.httpClient.get(languagesUrl, {
            headers: this.headers
        }).pipe((0, rxjs_1.map)((response) => response.data));
    }
};
exports.AppService = AppService;
exports.AppService = AppService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof axios_1.HttpService !== "undefined" && axios_1.HttpService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object])
], AppService);


/***/ }),
/* 11 */
/***/ ((module) => {

module.exports = require("rxjs");

/***/ }),
/* 12 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RepoDetailsDTO = void 0;
class RepoDetailsDTO {
}
exports.RepoDetailsDTO = RepoDetailsDTO;


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
const common_1 = __webpack_require__(1);
const core_1 = __webpack_require__(2);
const app_module_1 = __webpack_require__(3);
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const globalPrefix = 'api';
    app.setGlobalPrefix(globalPrefix);
    const port = process.env['PORT'] || 3000;
    await app.listen(port);
    common_1.Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
}
bootstrap();

})();

/******/ })()
;