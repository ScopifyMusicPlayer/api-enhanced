// 乐迷团详情，包含名称、头像、topicId 和 boardId 等上游字段。
const createOption = require('../../util/option.js')

module.exports = (query, request) => {
  const groupId =
    typeof query.groupId === 'string' ? query.groupId.trim() : ''

  if (!/^\d+$/.test(groupId)) {
    return Promise.resolve({
      status: 400,
      body: { code: 400, message: 'groupId must be a numeric string' },
      cookie: [],
    })
  }

  return request(
    '/api/social/fansgroup/bff/detail/get',
    { groupId, scene: query.scene ?? '' },
    createOption(
      { ...query, domain: query.domain || 'https://interface3.music.163.com' },
      'eapi',
    ),
  )
}
