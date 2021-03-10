
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const dotenv = require('dotenv')
const aws = require('aws-sdk')
const multer = require('multer')
const multerS3 = require('multer-s3')
const mongodb = require('mongodb')

dotenv.config()
const app = express()

//middleWare
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors())

aws.config.update({
  apiVersion: "2006-03-01",
  accessKeyId: process.env.AWSAccessKeyId,
  secretAccessKey: process.env.AWSSecretKey,
  region: process.env.AWSRegion
})

const s3 = new aws.S3()

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWSBucket,
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname})
    },
    key: (req, file, cb) => {
      cb(null, Date.now().toString() + file.originalname)
    }
  })
})

app.get('/', async (req, res) => {
  res.status(200).send('S3 Upload Backend')
})

app.post('/', upload.single('photo'), async (req, res) => {
  try {
    const users = await loadUsersCollection();
    await users.insertOne({
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      phone: req.body.phone,
      email: req.body.email,
      age: req.body.age,
      photo: req.file.location,
      password: req.body.password
    })
    res.status(201).send('success')
  }
  catch (err) {
    res.status(500).send({
      error: 'error occured creating user'
    })
  }
})
async function loadUsersCollection () {
  const client = await mongodb.MongoClient.connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  return client.db('vue-multers3').collection('users')
}

const port = process.env.PORT || 5000
app.listen(port, () => {
console.log(`server started on port ${port}`)
});