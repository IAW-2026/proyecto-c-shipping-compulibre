# Documentacion entrega 2 - Shipping App Compu Libre

> ## 1. Link al deploy de producción

`https://proyecto-c-shipping-compulibre.vercel.app`


---


> ## 2. Usuarios disponibles para utilizar o evaluar la aplicación

- **Usuario normal:**

- **Usuario administrador:**

    *Aclaración: el usuario normal no es requerido para el uso de la aplicación normal, solo se utiliza para testear que no puede acceder al panel de administradores por falta de permisos*

**Login del panel de administradores**
- `https://proyecto-c-shipping-compulibre.vercel.app/sign-in`

  **No se utiliza una contraseña, solo con ingresar el codigo que es enviado al email es suficiente**


---


> ## 3. Instrucciones que consideren necesarias para utilizar o evaluar la aplicación.

  **Flujo de usuario normal**:
- El usuario ingresa su numero de tracking
- Se despliega por pantalla los datos del pedido

**Flujo de administrador**:
- El administrador va al panel de login de adminstradores e inicia sesion con una cuenta de tipo `admin`
- El administrador ve el estado de todos los envios y crea, elimina y modifica los pedidos

**IMPORTANTE: Uso de la pagina para testear el courier**
- `https://courier-shipping-compulibre.onrender.com/`
- Por la forma en la que planteamos el problema, cada vez que creamos un envio enviamos un webhook a una mock API que simula una pagina propia del courier con el la courier tracking ID (la supuesta tracking ID del courier) y un link al cual llamar cuando haya actualizaciones.
- Se puede simular el cambio de estado de un paquete, escribiendo el courier tracking ID, donde se encuentra ahora el paquete y su estado(recien empaquetado, en transito, etc). Tambien por cuestiones de seguridad es necesario una COURIER API KEY, que esta al final del documento junto al resto de KEYS del proyecto.


---


> ## 4. Breve descripción del proyecto.
La shipping app de Compu Libre es una aplicación web simple diseñada para que el usuario pueda ingresar a ver información relevante estado de su pedido. Su principal trabajo es interconectar a los usuarios (tanto al comprador como al vendedor) con el courier y el estado de sus paquetes. 
Ademas, la aplicación tiene la capacidad de pasarle dicha información en forma de JSON a pedido y de informar a la buyer y seller app de cambios en el estados en paquetes relevantes al usuario.
Por su parte, tambien permite a los administradores intervenir en caso de que haya alguna falla, ya sea creando un nuevo pedido, actualizando manualmente el estado de uno ya existente o borrandolo.


---


> ## 5. Notas o comentarios para la corrección
- KEYS del proyecto:
    - **SELLER_API_KEY =** 4ch79bsgnp9xj6dpu1f3wt16rnprhrxd
    - **SHIPPING_API_KEY =** 296l1gzir92d2un7du8erbksou9f5xpf
    - **PAYMENTS_API_KEY =** 0srf8e6kogjdla9fn04be73n9v13lg07
    - **BUYER_API_KEY =** 3gd8fbza7huokb0pp4wb3hb369w6qxjf
    - **COURIER_API_KEY=** 8d7c7f1f0f6b1c4e6a2e9b7d3c8f5a1e4d9c2b6f7a8e1c3d5f9b2a7e6c4d8f1

- La seguridad de los endpoints no esta implementada por completo, si bien la mayoria estan protegidos, incluidos todos aquellos endpoints que son consultados por otras apps (Buyer, Seller, Courier), hay algunos que por constricciones de tiempo no puedieron ser implementados aun.
- Al pedir todos los shipments para el dashboard del admin, hago la request desde el front end, exponiendo la SHIPPING_API_KEY en el proceso, sin embargo, lo considere aceptable ya que a la unica persona a la KEY quedaria expuesto es al propio administrador, no es posible que un usuario comun acceda a ella.
- Como se mencionó anteriormente, para ingresar al panel de admin no es necesario la contraseña, solo ingresar el codigo enviado el email, en caso de no ser una alternativa valida, se cambiara para la proxima entrega.