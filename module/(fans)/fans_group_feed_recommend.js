// 乐迷团推荐笔记。保留上游 records 与字符串游标，不聚合或自动翻页。
const createOption = require('../../util/option.js')

module.exports = (query, request) => {
  const fansGroupId =
    typeof query.fansGroupId === 'string' ? query.fansGroupId.trim() : ''
  const cursor = query.cursor ?? '0'
  const size = Number(query.size ?? 10)

  if (
    !/^\d+$/.test(fansGroupId) ||
    typeof cursor !== 'string' ||
    !cursor.length ||
    !Number.isSafeInteger(size) ||
    size <= 0
  ) {
    return Promise.resolve({
      status: 400,
      body: {
        code: 400,
        message:
          'fansGroupId must be a numeric string, cursor a non-empty string, and size a positive integer',
      },
      cookie: [],
    })
  }

  return request(
    '/api/fans/group/feed/recommend/get',
    { artistSelf: '0', fansGroupId, cursor, size: String(size) },
    createOption(
      { ...query, domain: query.domain || 'https://interface3.music.163.com' },
      'eapi',
    ),
  )
}
