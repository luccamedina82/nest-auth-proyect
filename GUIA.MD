# Arquitectura Modular Basada en Características (Feature-Based Architecture)
Componente,Función Principal,¿Qué hace en tu Auth?
Module,Organizar y encapsular,Agrupa todo lo relacionado con usuarios y login.
DTO,Validar entrada,Revisa que el email sea un email real y la clave sea larga.
Guard,Autorizar acceso,Protege rutas como /perfil para que solo entren usuarios logueados.
Controller,Orquestar rutas,Define el endpoint /api/auth/register.
Service,Lógica de negocio,Hashea la contraseña y guarda al usuario en la DB.
Entity,Definir datos,Crea la tabla users en tu base de datos de Docker.


## 📋 Índice
1. [Introducción](#introducción)
2. [Principios Clave](#principios-clave)
3. [Estructura de Carpetas](#estructura-de-carpetas)
4. [Componentes de un Módulo](#componentes-de-un-módulo)
5. [Cómo Implementarlo](#cómo-implementarlo)
6. [Patrones y Mejores Prácticas](#patrones-y-mejores-prácticas)
7. [Ejemplos Prácticos](#ejemplos-prácticos)

---

## Introducción

La **Arquitectura Modular Basada en Características** es un patrón de diseño donde la aplicación se organiza alrededor de **dominios de negocio** en lugar de capas técnicas.

### Nombres alternativos:
- **Feature-Based Architecture**
- **Domain-Driven Modules (DDD)**
- **Feature Modules**
- **Modular Monolith Architecture**

### Ventajas:
✅ **Escalabilidad**: Fácil agregar nuevas funcionalidades sin afectar las existentes  
✅ **Reusabilidad**: Módulos independientes pueden usarse en otros proyectos  
✅ **Mantenibilidad**: Lógica relacionada está en un mismo lugar  
✅ **Testing**: Cada módulo puede testearse de forma independiente  
✅ **Claridad**: Estructura refleja el dominio del negocio  
✅ **Autonomía de equipos**: Diferentes equipos pueden trabajar en módulos diferentes  

---

## Principios Clave

### 1. **Independencia**
Cada módulo debe ser lo más independiente posible. Si necesita funcionalidad de otro módulo, debe importarlo explícitamente.

### 2. **Encapsulación**
Un módulo solo expone lo que necesita. Los internals (detalles de implementación) se mantienen privados.

### 3. **Cohesión Alta**
Toda la funcionalidad relacionada con una característica está en su módulo. Por ejemplo, todas las operaciones de productos están en `products/`.

### 4. **Acoplamiento Bajo**
Los módulos tienen mínimas dependencias entre ellos. No hay dependencias circulares.

### 5. **Responsabilidad Única**
Cada módulo tiene una única razón para cambiar: cuando su dominio de negocio cambia.

---

## Estructura de Carpetas

### Estructura Recomendada por Módulo

```
src/
├── auth/                          # Módulo de Autenticación
│   ├── auth.controller.ts         # Endpoints HTTP
│   ├── auth.service.ts            # Lógica de negocio
│   ├── auth.module.ts             # Configuración del módulo
│   ├── decorators/                # Decoradores personalizados
│   │   ├── auth.decorator.ts
│   │   └── public.decorator.ts
│   ├── dto/                       # Data Transfer Objects (entrada/salida)
│   │   ├── login.dto.ts
│   │   ├── register.dto.ts
│   │   └── jwt-payload.dto.ts
│   ├── entities/                  # Modelos de BD
│   │   └── user.entity.ts
│   ├── guards/                    # Guards (protección de rutas)
│   │   ├── auth.guard.ts
│   │   └── jwt.guard.ts
│   ├── interfaces/                # Interfaces TypeScript
│   │   └── jwt-payload.interface.ts
│   └── strategies/                # Estrategias de Passport
│       └── jwt.strategy.ts
│
├── products/                      # Módulo de Productos
│   ├── products.controller.ts
│   ├── products.service.ts
│   ├── products.module.ts
│   ├── dto/
│   │   ├── create-product.dto.ts
│   │   ├── update-product.dto.ts
│   │   └── pagination.dto.ts
│   ├── entities/
│   │   ├── product.entity.ts
│   │   └── product-image.entity.ts
│   └── helpers/                   # Funciones utilitarias del módulo
│       └── product-helper.ts
│
├── files/                         # Módulo de Gestión de Archivos
│   ├── files.controller.ts
│   ├── files.service.ts
│   ├── files.module.ts
│   ├── dto/
│   │   └── file-response.dto.ts
│   └── helpers/
│       └── file-storage.helper.ts
│
├── seed/                          # Módulo de Datos Iniciales
│   ├── seed.controller.ts
│   ├── seed.service.ts
│   ├── seed.module.ts
│   └── data/
│       └── seed-data.ts
│
├── messages-ws/                   # Módulo de WebSockets
│   ├── messages-ws.gateway.ts     # WebSocket Gateway
│   ├── messages-ws.service.ts
│   ├── messages-ws.module.ts
│   ├── dto/
│   │   └── message.dto.ts
│   └── interfaces/
│       └── message.interface.ts
│
├── common/                        # Módulo Compartido (Utilities)
│   ├── common.module.ts
│   ├── dtos/                      # DTOs reutilizables
│   │   └── pagination.dto.ts
│   ├── decorators/                # Decoradores globales
│   ├── guards/                    # Guards globales
│   ├── filters/                   # Exception Filters
│   ├── interceptors/              # Interceptors
│   └── pipes/                     # Pipes personalizadas
│
├── app.module.ts                  # Módulo Raíz
└── main.ts                        # Punto de entrada
```

---

## Componentes de un Módulo

### 1. **Entity / Model**
Representa la estructura de datos en la base de datos.

```typescript
// products/entities/product.entity.ts
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { unique: true })
  title: string;

  @Column('float', { default: 0 })
  price: number;

  @Column({ default: true })
  isActive: boolean;
}
```

### 2. **DTO (Data Transfer Object)**
Define la forma de los datos que entran/salen de la API.

```typescript
// products/dto/create-product.dto.ts
import { IsString, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({
    description: 'Título del producto',
    example: 'Laptop Dell',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Precio del producto',
    example: 999.99,
  })
  @IsNumber()
  @IsPositive()
  price: number;
}
```

### 3. **Service**
Contiene la lógica de negocio. Es el corazón del módulo.

```typescript
// products/products.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    const product = this.productRepo.create(createProductDto);
    return await this.productRepo.save(product);
  }

  async findAll() {
    return await this.productRepo.find();
  }

  async findOne(id: string) {
    return await this.productRepo.findOneBy({ id });
  }

  async update(id: string, updateData: Partial<CreateProductDto>) {
    await this.productRepo.update(id, updateData);
    return this.findOne(id);
  }

  async delete(id: string) {
    const result = await this.productRepo.delete(id);
    return result.affected > 0;
  }
}
```

### 4. **Controller**
Maneja las rutas HTTP y delega la lógica al servicio.

```typescript
// products/products.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo producto' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los productos' })
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un producto por ID' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un producto' })
  update(@Param('id') id: string, @Body() updateData: CreateProductDto) {
    return this.productsService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un producto' })
  delete(@Param('id') id: string) {
    return this.productsService.delete(id);
  }
}
```

### 5. **Module**
Encapsula el controlador, servicio y entidades. Define qué se expone al resto de la aplicación.

```typescript
// products/products.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product, ProductImage } from './entities';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  imports: [
    TypeOrmModule.forFeature([Product, ProductImage]),
    AuthModule, // Importar módulo externo si es necesario
  ],
  exports: [
    ProductsService,    // Exportar para que otros módulos lo usen
    TypeOrmModule,      // Exportar acceso a las entidades
  ],
})
export class ProductsModule {}
```

---

## Cómo Implementarlo

### Paso 1: Generar la Estructura Base

```bash
# Crear la carpeta del módulo
mkdir src/mi-modulo

# Crear archivos base
touch src/mi-modulo/{mi-modulo.module.ts,mi-modulo.controller.ts,mi-modulo.service.ts}
mkdir src/mi-modulo/{dto,entities,interfaces,decorators,guards}
```

### Paso 2: Definir la Entity

```typescript
// src/users/entities/user.entity.ts
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { unique: true })
  email: string;

  @Column('text')
  name: string;

  @Column('text')
  password: string; // Guardar hasheada siempre

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
```

### Paso 3: Crear DTOs

```typescript
// src/users/dto/create-user.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsString()
  @MinLength(8)
  password: string;
}

// src/users/dto/update-user.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {}
```

### Paso 4: Implementar el Servicio

```typescript
// src/users/users.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    // Validar que no exista el email
    const exists = await this.userRepo.findOneBy({ email: createUserDto.email });
    if (exists) {
      throw new BadRequestException('Email already exists');
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepo.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return await this.userRepo.save(user);
  }

  async findAll() {
    return await this.userRepo.find({
      select: ['id', 'email', 'name', 'isActive', 'createdAt'],
    });
  }

  async findOne(id: string) {
    return await this.userRepo.findOneBy({ id });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    if (!user) throw new BadRequestException('User not found');

    Object.assign(user, updateUserDto);
    return await this.userRepo.save(user);
  }

  async delete(id: string) {
    const result = await this.userRepo.delete(id);
    return result.affected > 0;
  }
}
```

### Paso 5: Crear el Controlador

```typescript
// src/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
```

### Paso 6: Crear el Módulo

```typescript
// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [TypeOrmModule.forFeature([User])],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
```

### Paso 7: Importar en App.Module

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      // Configuración...
      autoLoadEntities: true,
      synchronize: true,
    }),
    UsersModule,      // ✅ Agregar aquí
    ProductsModule,
  ],
})
export class AppModule {}
```

---

## Patrones y Mejores Prácticas

### 1. **Comunicación Entre Módulos**

❌ **Incorrecto**: Acceder directamente a la BD de otro módulo
```typescript
// ❌ MALO
@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Product) 
    private productRepo: Repository<Product>, // NO - No pertenece a este módulo
  ) {}
}
```

✅ **Correcto**: Usar el servicio exportado del otro módulo
```typescript
// ✅ BUENO
@Injectable()
export class OrdersService {
  constructor(
    private readonly productsService: ProductsService, // Usar servicio
  ) {}

  async createOrder(items: any[]) {
    for (const item of items) {
      const product = await this.productsService.findOne(item.productId);
      // Usar la lógica encapsulada
    }
  }
}
```

### 2. **Exports en Módulos**

```typescript
@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  imports: [TypeOrmModule.forFeature([Product, ProductImage])],
  exports: [
    ProductsService,      // ✅ Exportar servicio
    TypeOrmModule,        // ✅ Exportar acceso a entidades si es necesario
  ],
})
export class ProductsModule {}
```

### 3. **Manejo de Errores Consistente**

```typescript
// common/exceptions/custom.exception.ts
import { HttpException, HttpStatus } from '@nestjs/common';

export class ResourceNotFoundException extends HttpException {
  constructor(resource: string, id: any) {
    super(
      `${resource} with ID ${id} not found`,
      HttpStatus.NOT_FOUND,
    );
  }
}

// En el servicio:
async findOne(id: string) {
  const product = await this.productRepo.findOneBy({ id });
  if (!product) {
    throw new ResourceNotFoundException('Product', id);
  }
  return product;
}
```

### 4. **Validación de Entrada (DTOs)**

```typescript
// Siempre validar entrada
export class PaginationDto {
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}

// En main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,           // Eliminar propiedades no validadas
    forbidNonWhitelisted: true,// Error si hay propiedades extra
    transform: true,           // Transformar según DTOs
    transformOptions: {
      enableImplicitConversions: true,
    },
  }),
);
```

### 5. **Evitar Dependencias Circulares**

❌ **Mal**:
```
auth.module -> imports -> products.module
products.module -> imports -> auth.module  // ❌ Circular
```

✅ **Bien**: Crear un módulo `common` para utilidades compartidas

```
auth.module -> imports -> common.module
products.module -> imports -> common.module
(Sin dependencia directa entre ellos)
```

---

## Ejemplos Prácticos

### Ejemplo 1: Módulo de Pedidos (Orders)

```
src/orders/
├── orders.module.ts
├── orders.controller.ts
├── orders.service.ts
├── dto/
│   ├── create-order.dto.ts
│   └── update-order.dto.ts
├── entities/
│   └── order.entity.ts
└── interfaces/
    └── order.interface.ts
```

```typescript
// orders/orders.service.ts
@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    private readonly productsService: ProductsService,
    private readonly usersService: UsersService,
  ) {}

  async create(userId: string, createOrderDto: CreateOrderDto) {
    // Validar que el usuario existe
    const user = await this.usersService.findOne(userId);
    if (!user) throw new BadRequestException('User not found');

    // Validar que los productos existen
    for (const item of createOrderDto.items) {
      const product = await this.productsService.findOne(item.productId);
      if (!product) throw new BadRequestException(`Product ${item.productId} not found`);
    }

    // Crear la orden
    const order = this.orderRepo.create({
      userId,
      items: createOrderDto.items,
      total: createOrderDto.items.reduce((sum, item) => sum + item.quantity * item.price, 0),
    });

    return await this.orderRepo.save(order);
  }
}
```

### Ejemplo 2: Módulo de Categorías (Categories)

```typescript
// categories/categories.service.ts
@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
  ) {}

  async findAll() {
    return await this.categoryRepo.find({
      relations: ['products'], // Cargar productos relacionados
    });
  }

  async findBySlug(slug: string) {
    return await this.categoryRepo.findOneBy({ slug });
  }
}

// categories/categories.module.ts
@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService],
  imports: [TypeOrmModule.forFeature([Category])],
  exports: [CategoriesService, TypeOrmModule],
})
export class CategoriesModule {}
```

---

## Checklist para Crear un Nuevo Módulo

- [ ] Crear carpeta `src/nombre-modulo/`
- [ ] Definir Entity en `entities/nombre.entity.ts`
- [ ] Crear DTOs en `dto/` (Create, Update, Response)
- [ ] Implementar Service con lógica de negocio
- [ ] Crear Controller con rutas HTTP
- [ ] Crear Module y exportar lo necesario
- [ ] Importar Module en `app.module.ts`
- [ ] Agregar validación en DTOs
- [ ] Agregar documentación en Swagger
- [ ] Escribir tests (unit y e2e)
- [ ] Actualizar este documento si hay patrones nuevos

---

## Conclusión

Esta arquitectura modular es altamente escalable y mantenible. Es ideal para equipos que trabajan en paralelo, proyectos que crecen con el tiempo, y cuando necesitas reutilizar código en múltiples proyectos.

**Recuerda**: La clave está en:
- ✅ Baja dependencia entre módulos
- ✅ Alta cohesión dentro del módulo
- ✅ Interfaces claras (exports)
- ✅ Validación robusta (DTOs)
- ✅ Manejo de errores consistente
