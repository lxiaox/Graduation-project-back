// 登录
module.exports = function (server, fs, MongoClient, url) {
  server.post('/signIn', (request, response) => {
    let user = request.body
    MongoClient.connect(url, { useNewUrlParser: true }, function (err, db) {
      if (err) throw err
      let dbo = db.db("AlbumDB")
      dbo.collection('users').find({ 'userName': user.userName, 'password': user.password }).toArray(function (err, result) {
        if (err) throw err;
        if (result.toString() === '') {
          response.status(404)
          response.send('用户名或密码错误')
        } else {
          response.status(200)
          response.send(result[0])
        }
      })
      db.close()
    })
  })
}