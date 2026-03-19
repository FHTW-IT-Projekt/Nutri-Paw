const express = require('express')
const app = express()
const port = 3000

const apiPrefix = '/api/';

app.get(apiPrefix + 'getSampleData', (req, res) => {
  const respone = {
    id: 5,
    name: 'Test Response',
    description: 'Go Team NutriPaw',
  }
  res.json(respone)
})

app.listen(port, () => {
  console.log(`Nutripaw app listening on port ${port}`)
})
