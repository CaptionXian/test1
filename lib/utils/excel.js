const excel = require('excel-export')

const exportExcel = async (_headers, rows) => {
  var conf = {}
  conf.name = 'mysheet'
  conf.cols = []
  for (var i = 0; i < _headers.length; i++) {
    var col = {}
    col.caption = _headers[i].caption
    col.type = _headers[i].type
    col.width = _headers[i].width
    conf.cols.push(col)
  }
  conf.rows = rows
  var result = excel.execute(conf)
  return result
}

module.exports = {
  exportExcel
}
