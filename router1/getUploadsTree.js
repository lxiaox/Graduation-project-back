module.exports = function (server, fs, MongoClient, url, ObjectID) {
  // 获取图片
  server.get('/getUploadsTree', (request, response) => {
    // 初始化
    let userId = request.query.userId
    let amount = Number(request.query.queryAmount)
    let count = Number(request.query.queryCount) * amount
    let returnImagesTree = []
    //查albumName
    function findAlbumName(album, dbo) {
      let albumId = ObjectID(album)
      return new Promise((resolve, reject) => {
        dbo.collection('albums').find({
          '_id': ObjectID(albumId),
          'isDeleted': false
        }).toArray(function (err, result) {
          if (err) throw err;
          let albumName = result[0].albumName
          resolve(albumName)
        })
      })
    }
    //查图片
    function findImages(number, dbo) {
      let uploadNumber = number.toString()
      return new Promise((resolve, reject) => {
        dbo.collection('images').find({
          'uploadNumber': uploadNumber,
          'isDeleted': false
        }).toArray(function (err, result) {
          if (err) throw err;
          result.forEach(item => {
            let img = 'data:image/jpeg;base64,'
            img = img + fs.readFileSync(`${item.imageSrc}`, 'base64')
            item.imageData = img
          })
          resolve(result)
        })
      })
    }
    MongoClient.connect(url, { useNewUrlParser: true }, function (err, db) {
      if (err) throw err
      let dbo = db.db("AlbumDB")
      let whereStr = {
        'userId': userId,
        'isDeleted': false
      }
      dbo.collection('uploads').find(whereStr)
        .sort({ '_id': -1 })
        .skip(count).limit(amount)
        .toArray(function (err, result) {
          if (err) throw err;
          if (result.toString() === '') {
            response.status(201)
            response.send('未添加任何照片')
            db.close()
          } else {
            let forCount = 0
            let length = result.length
            //对结果进行循环，每一个：查albumName，查该次上传所有图片，push这个结果
            function getResult(item) {
              let treeObj = {
                uploadNumber: item._id,
                albumId: item.albumId,
                uploadDate: item.uploadDate
              }
              //查albumName
              findAlbumName(item.albumId, dbo).then(value => {
                treeObj.albumName = value
              }).then(value => {
                //查图片
                return findImages(item._id, dbo)
              }).then(value => {
                forCount = forCount + 1
                treeObj.imagesArr = value
                returnImagesTree.push(treeObj)
                if (forCount === length) {
                  response.status(200)
                  response.send(returnImagesTree)
                  db.close()
                } else {
                  getResult(result[forCount])
                }
              })
            }
            getResult(result[0])
          }
        })
    })
  })
}