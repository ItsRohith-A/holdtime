import type { Card } from '../types'
import { GIT } from './git'
import { JAVASCRIPT } from './javascript'
import { PYTHON } from './python'

/** Every card Holdtime ships. */
export const CARDS: readonly Card[] = [...JAVASCRIPT, ...PYTHON, ...GIT]
