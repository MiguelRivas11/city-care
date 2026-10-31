import { configApp } from '@adonisjs/eslint-config'

export default configApp({
  name: 'Ignore generated SDK',
  ignores: ['sdk/generated/**'],
})
