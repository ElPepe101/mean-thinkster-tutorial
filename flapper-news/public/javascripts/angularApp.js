'use strict'
var angular = angular ? angular : null

// ······································
// ·············· MODULE ················
var app = angular.module('flapperNews', ['ui.router'])
var config = function ($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('home', {
      url: '/home',
      templateUrl: '/home.html',
      controller: 'HomeCtrl',
      controllerAs: 'home',
      resolve: {
        postPromise: [
          'posts',
          function (posts) {
            return posts.getAll()
          }
        ]
      }
    })
    .state('posts', {
      url: '/posts/{id}',
      templateUrl: '/posts.html',
      controller: 'PostsCtrl',
      controllerAs: 'posts'
    })

  $urlRouterProvider.otherwise('home')
}
app.config(['$stateProvider', '$urlRouterProvider', config])

// ······································
// ············· SERVICE ················
var posts = function ($http) {
  var posts = {
    posts: []
  }

  posts.getAll = function () {
    var getPosts = function (data) {
      angular.copy(data, posts.posts)
    }

    return $http.get('/posts').success(getPosts)
  }

  return posts
}
app.factory('posts', ['$http', posts])

// ·············································
// ············ HOME CONTROLLER ················
var HomeCtrl = function (posts) {
  var self = this

  self.posts = posts.posts

  self.addPost = function () {
    if (!self.title || self.title === '') return

    self.posts.push(
      {
        title: self.title,
        link: self.link,
        upvotes: 0,
        comments: [
          {author: 'Joe', body: 'Cool post!', upvotes: 0},
          {author: 'Bob', body: 'Great idea but everything is wrong!', upvotes: 0}
        ]
      }
    )
    self.title = ''
    self.link = ''
  }

  self.incrementUpvotes = function (post) {
    post.upvotes += 1
  }
}
app.controller('HomeCtrl', ['posts', HomeCtrl])

// ··············································
// ············ POSTS CONTROLLER ················
var PostsCtrl = function ($stateParams, posts) {
  var self = this

  self.post = posts.posts[$stateParams.id]

  self.addComment = function () {
    if (self.body === '') return
    self.post.comments.push({
      body: self.body,
      author: 'user',
      upvotes: 0
    })
    self.body = ''
  }
}
app.controller('PostsCtrl', ['$stateParams', 'posts', PostsCtrl])
