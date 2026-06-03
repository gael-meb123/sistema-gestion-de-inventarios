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

export const actualizarPerfilSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  email: z.string().email('Ingresa un email valido').optional(),
  passwordActual: z.string().optional(),
  passwordNueva: z.string().min(6, 'La nueva contrasena debe tener al menos 6 caracteres').optional(),
  confirmarPasswordNueva: z.string().optional(),
}).superRefine((data, ctx) => {
  const cambiaNombre = Boolean(data.nombre?.trim());
  const cambiaEmail = Boolean(data.email?.trim());
  const cambiaPassword = Boolean(data.passwordNueva);

  if (!cambiaNombre && !cambiaEmail && !cambiaPassword) {
    ctx.addIssue({
      code: 'custom',
      path: ['nombre'],
      message: 'Indica al menos un dato para actualizar',
    });
  }

  if ((cambiaEmail || cambiaPassword) && (!data.passwordActual || data.passwordActual.length === 0)) {
    ctx.addIssue({
      code: 'custom',
      path: ['passwordActual'],
      message: 'La contrasena actual es obligatoria para cambiar email o contrasena',
    });
  }

  if (cambiaPassword) {
    if (!data.confirmarPasswordNueva) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmarPasswordNueva'],
        message: 'Confirma la nueva contrasena',
      });
    } else if (data.passwordNueva !== data.confirmarPasswordNueva) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmarPasswordNueva'],
        message: 'Las contrasenas no coinciden',
      });
    }
  }
})

export const checkoutTarjetaSchema = z.object({
  titular: z.string().trim().min(3, 'El titular debe tener al menos 3 caracteres'),
  numero: z.string().trim().transform((valor) => valor.replace(/\D/g, ''))
    .pipe(z.string().min(13, 'Numero de tarjeta invalido').max(19, 'Numero de tarjeta invalido')),
  expiracion: z.string().trim().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Expiracion invalida (MM/YY)'),
  cvv: z.string().trim().regex(/^\d{3,4}$/, 'CVV invalido'),
})

export const crearProductoSchema = z.object({
  nombre: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
  precio: z.coerce.number().positive('El precio debe ser mayor a 0'),
  stock: z.coerce.number().int('El stock debe ser entero').nonnegative('El stock no puede ser negativo'),
  imagen: z.instanceof(File).nullable().optional()
    .refine((file) => !file || mimePermitidos.includes(file.type), 'Solo se permiten imagenes JPG, PNG o WEBP')
    .refine((file) => !file || file.size <= TAMANO_MAXIMO_IMAGEN, 'La imagen no puede exceder 2MB'),
})
