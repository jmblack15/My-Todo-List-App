import { createMMKV } from 'react-native-mmkv'

const mmkv = createMMKV({ id: 'app-storage' })

export const storage = {
  getString(key: string): string | undefined {
    return mmkv.getString(key)
  },

  setString(key: string, value: string): void {
    mmkv.set(key, value)
  },

  getBoolean(key: string): boolean | undefined {
    return mmkv.getBoolean(key)
  },

  setBoolean(key: string, value: boolean): void {
    mmkv.set(key, value)
  },

  delete(key: string): void {
    mmkv.remove(key)
  },
}
