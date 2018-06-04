/*
 * Copyright (C) 2015 The Gravitee team (http://gravitee.io)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import _ = require('lodash');

class ApiEndpointController {

  private group: any;
  private api: any;
  private endpoint: any;
  private initialEndpoints: any;
  private initialEndpoint: any;
  private tenants: any;
  private creation: boolean = false;

  constructor(
    private ApiService,
    private NotificationService,
    private $scope,
    private $rootScope,
    private $state,
    private $stateParams,
    private resolvedTenants) {
    'ngInject';

    this.api = this.$scope.$parent.apiCtrl.api;
    this.tenants = resolvedTenants.data;

    this.group = _.find(this.api.proxy.groups, { 'name': $stateParams.groupName});
    this.endpoint = _.find(this.group.endpoints, { 'name': $stateParams.endpointName});
    this.initialEndpoints = _.cloneDeep(this.group.endpoints);

    // Creation mode
    if (!this.endpoint) {
      this.endpoint = {
        weight: 1,
        http: {
          connectTimeout : 5000,
          idleTimeout : 60000,
          keepAlive : true,
          readTimeout : 10000,
          pipelining : false,
          maxConcurrentConnections : 100,
          useCompression : true,
          followRedirects : false
        }
      };

      this.creation = true;
    }

    // Keep the initial state in case of form reset
    this.initialEndpoint = _.cloneDeep(this.endpoint);

    this.$scope.proxies = [
      {
        name: 'HTTP CONNECT proxy',
        value: 'HTTP'
      }, {
        name: 'SOCKS4/4a tcp proxy',
        value: 'SOCKS4'
      }, {
        name: 'SOCKS5 tcp proxy',
        value: 'SOCKS5'
      }];
  }

  update(api) {
    let group: any = _.find(this.api.proxy.groups, { 'name': this.$stateParams.groupName});

    if (!_.includes(group.endpoints, this.endpoint)) {
      group.endpoints = group.endpoints || [];
      group.endpoints.push(this.endpoint);
    }

    this.ApiService.update(api).then((updatedApi) => {
      this.api = updatedApi.data;
      this.api.etag = updatedApi.headers('etag');
      this.onApiUpdate();
      this.initialEndpoints = _.cloneDeep(group.endpoints);
    });
  }

  onApiUpdate() {
    this.$rootScope.$broadcast('apiChangeSuccess', {api: this.api});
    this.NotificationService.show('Endpoint saved');
    this.$state.go('management.apis.detail.proxy.endpoints');
  }

  reset() {
    this.$scope.formEndpoint.$setPristine();
    this.endpoint = _.cloneDeep(this.initialEndpoint);
  }

  backToEndpointsConfiguration() {
    let group: any = _.find(this.api.proxy.groups, { 'name': this.$stateParams.groupName});
    group.endpoints = _.cloneDeep(this.initialEndpoints);
    this.$state.go('management.apis.detail.proxy.endpoints');
  }

  toggleTrustAll() {
    if (this.endpoint.ssl.trustAll === true) {
      this.endpoint.ssl.enabled = true;
    }
  }

  toggleSSL() {
    if (!this.endpoint.ssl.enabled) {
      this.endpoint.ssl.trustAll = false;
    }
  }
}

export default ApiEndpointController;
