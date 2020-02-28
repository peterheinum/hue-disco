import express from 'express'
import React from 'react'
import { renderToString } from 'react-dom/server'
import App from '../components/App'
import hbs from 'handlebars';

const router = express.Router()

router.get('/', async (req, res) => {
  const htmlTemplate = `
    <div id='reactTemplate'>{{{reactTemplate}}}</div>
    <script src='./app.js' charset='utf-8'></script>
    <script src='/vendor.js' charset='utf-8'></script>
    `

  const handleBarsTemplate = hbs.compile(htmlTemplate);
  const reactTemplate = renderToString(<App />);
  const compiledHtml = handleBarsTemplate({ reactTemplate });
  res.send(compiledHtml)
})

module.exports = router