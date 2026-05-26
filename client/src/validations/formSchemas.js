import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Ingresa un email valido'),
  password: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres'),
})

export const registroSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Ingresa un email valido'),
  password: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres'),
  rol: z.enum(['admin', 'user']),
  adminSetupKey: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.rol === 'admin' && (!data.adminSetupKey || data.adminSetupKey.trim().length === 0)) {
    ctx.addIssue({
      code: 'custom',
      path: ['adminSetupKey'],
      message: 'La clave de admin es obligatoria para ese rol',
    })
  }
})

const mimePermitidos = ['image/jpeg', 'image/png', 'image/webp']
const TAMANO_MAXIMO_IMAGEN = 2 * 1024 * 1024

export const crearProductoSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
  precio: z.coerce.number().positive('El precio debe ser mayor a 0'),
  stock: z.coerce.number().int('El stock debe ser entero').nonnegative('El stock no puede ser negativo'),
  imagen: z.instanceof(File).nullable().optional()
    .refine((file) => !file || mimePermitidos.includes(file.type), 'Solo se permiten imagenes JPG, PNG o WEBP')
    .refine((file) => !file || file.size <= TAMANO_MAXIMO_IMAGEN, 'La imagen no puede exceder 2MB'),
})
