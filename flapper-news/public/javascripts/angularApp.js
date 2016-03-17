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
      controllerAs: 'posts',
      resolve: {
        post: [
          '$stateParams',
          'posts',
          function ($stateParams, posts) {
            return posts.getPost($stateParams.id)
          }
        ]
      }
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

  posts.create = function (post) {
    var postPost = function (data) {
      posts.posts.push(data)
    }
    return $http.post('/posts', post).success(postPost)
  }

  posts.upvote = function (post) {
    var putPostUpvote = function (data) {
      post.upvotes += 1
    }
    return $http.put('/posts/' + post._id + '/upvote').success(putPostUpvote)
  }

  posts.getPost = function (id) {
    var getPost = function (res) {
      return res.data
    }
    return $http.get('/posts/' + id).then(getPost)
  }

  posts.addPostComment = function (id, comment) {
    return $http.post('/posts/' + id + '/comments', comment)
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

    posts.create(
      {
        title: self.title,
        link: self.link
      }
    )
    self.title = ''
    self.link = ''
  }

  self.incrementUpvotes = function (post) {
    posts.upvote(post)
  }
}
app.controller('HomeCtrl', ['posts', HomeCtrl])

// ··············································
// ············ POSTS CONTROLLER ················
var PostsCtrl = function (posts, post) {
  var self = this
  console.log(post)
  self.post = post

  self.addComment = function () {
    if (self.body === '') return
    var success = function (comment) {
      self.post.comments.push(comment)
    }

    posts.addComment(
      {
        body: self.body,
        author: 'user',
        upvotes: 0
      }
    ).success(success)
    self.body = ''
  }
}
app.controller('PostsCtrl', ['posts', 'post', PostsCtrl])
