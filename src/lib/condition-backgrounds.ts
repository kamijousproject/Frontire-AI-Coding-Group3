type ConditionGroup = 'sunny' | 'partly_cloudy' | 'cloudy' | 'rain' | 'snow' | 'thunder' | 'fog' | 'fallback'

const PAGE_CLASSES: Record<ConditionGroup, { day: string; night: string }> = {
  sunny:        { day: 'bg-gradient-to-b from-sky-400 to-blue-500',    night: 'bg-gradient-to-b from-blue-900 to-indigo-950' },
  partly_cloudy:{ day: 'bg-gradient-to-b from-slate-300 to-blue-300',  night: 'bg-gradient-to-b from-blue-900 to-slate-800' },
  cloudy:       { day: 'bg-gradient-to-b from-gray-400 to-gray-500',   night: 'bg-gradient-to-b from-gray-800 to-gray-900' },
  rain:         { day: 'bg-gradient-to-b from-blue-700 to-blue-800',   night: 'bg-gradient-to-b from-blue-900 to-blue-950' },
  snow:         { day: 'bg-gradient-to-b from-blue-100 to-slate-200',  night: 'bg-gradient-to-b from-slate-700 to-blue-900' },
  thunder:      { day: 'bg-gradient-to-b from-purple-800 to-purple-900', night: 'bg-gradient-to-b from-purple-950 to-gray-950' },
  fog:          { day: 'bg-gradient-to-b from-gray-400 to-gray-500',   night: 'bg-gradient-to-b from-gray-700 to-gray-800' },
  fallback:     { day: 'bg-gradient-to-b from-gray-400 to-gray-500',   night: 'bg-gradient-to-b from-gray-700 to-gray-800' },
}

const CARD_CLASSES: Record<ConditionGroup, { day: string; night: string }> = {
  sunny:        { day: 'bg-sky-300/20',    night: 'bg-indigo-900/20' },
  partly_cloudy:{ day: 'bg-slate-300/20',  night: 'bg-slate-800/20' },
  cloudy:       { day: 'bg-gray-400/20',   night: 'bg-gray-800/20' },
  rain:         { day: 'bg-blue-700/20',   night: 'bg-blue-900/20' },
  snow:         { day: 'bg-blue-100/20',   night: 'bg-slate-700/20' },
  thunder:      { day: 'bg-purple-800/20', night: 'bg-purple-950/20' },
  fog:          { day: 'bg-gray-400/20',   night: 'bg-gray-700/20' },
  fallback:     { day: 'bg-gray-400/20',   night: 'bg-gray-700/20' },
}

function getGroup(code: number): ConditionGroup {
  if (code === 1000) return 'sunny'
  if (code === 1003) return 'partly_cloudy'
  if ([1006, 1007, 1008, 1009].includes(code)) return 'cloudy'
  if (
    code === 1063 ||
    (code >= 1150 && code <= 1201) ||
    (code >= 1240 && code <= 1246)
  ) return 'rain'
  if (
    code === 1066 ||
    (code >= 1114 && code <= 1117) ||
    (code >= 1210 && code <= 1237) ||
    (code >= 1255 && code <= 1264)
  ) return 'snow'
  if (code === 1087 || (code >= 1273 && code <= 1282)) return 'thunder'
  if ([1030, 1135, 1147].includes(code)) return 'fog'
  return 'fallback'
}

export function getPageBgClass(code: number, isDay: number): string {
  const group = getGroup(code)
  return PAGE_CLASSES[group][isDay === 1 ? 'day' : 'night']
}

export function getCardBgClass(code: number, isDay: number): string {
  const group = getGroup(code)
  return CARD_CLASSES[group][isDay === 1 ? 'day' : 'night']
}
