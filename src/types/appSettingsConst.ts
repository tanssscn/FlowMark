/**
 * as const 加了之后类型是字面量
 * 类型命名空间和变量命名空间是分开的,所以可以安全地使用相同的名称
 */
export const ImagePathTypeOptions = {
  ABSOULUTE : 'absolute',
  RELATIVE :'relative',
} as const;

export const ExternImagePathOptions = {
  KEEP: 'keep',
  TRANSFER : 'transfer',
} as const;