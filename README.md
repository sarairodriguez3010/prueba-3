# Dominó Numérico Infantil 🎲🔢

Un juego de dominó interactivo diseñado para niños de nivel preescolar, enfocado en el aprendizaje lógico-matemático y alineado con la **Nueva Escuela Mexicana (Fase 2)**. 

Este proyecto es una aplicación web responsiva, fluida y coloriva que permite jugar localmente a de **2 a 4 jugadores** en el mismo dispositivo, utilizando números legibles en lugar de los puntos tradicionales del dominó.

---

## 🌟 Características Destacadas

*   **Enfoque Preescolar:** Fichas de dominó con números gigantes de colores llamativos y consistentes (ej. el 1 es azul, el 3 es rojo) para facilitar la asociación visual rápida.
*   **De 2 a 4 Jugadores:** Configuración dinámica que permite ingresar los nombres de los niños y seleccionar avatares de animalitos tiernos.
*   **Inicio Automatizado:** El juego detecta automáticamente quién tiene la ficha inicial adecuada (comenzando por el doble 6) y la juega por ellos al centro del tablero para agilizar el inicio de la partida.
*   **Pantalla de Transición de Turnos:** Una pantalla intermedia que invita a pasar el dispositivo al siguiente jugador de forma segura para ocultar las fichas en juego.
*   **Lógica de Conexión Dinámica:** Resalta las fichas válidas en la mano con efectos luminosos y muestra indicadores dinámicos en los extremos del tablero.
*   **Sumatoria de Puntos y Ganador:** Al concluir la partida (por victoria o bloqueo), suma las fichas sobrantes de los jugadores y corona al ganador (menor puntaje) con una lluvia interactiva de confeti en Canvas.
*   **Guía Pedagógica Integrada:** Información accesible directamente desde el juego detallando el Campo Formativo y el Proceso de Desarrollo de Aprendizaje (PDA) de la Fase 2 de la NEM.

---

## 🏫 Alineación Pedagógica (Nueva Escuela Mexicana - NEM)

Este material educativo interactivo está directamente alineado con los programas de estudio de la Fase 2 (Preescolar):
-   **Campo Formativo:** Saberes y Pensamiento Científico.
-   **Contenido:** Los saberes numéricos como herramienta para resolver situaciones del entorno, en diversos contextos socioculturales.
-   **Procesos de Desarrollo de Aprendizaje (PDA):**
    -   *2º Grado:* Usa números en juegos y situaciones cotidianas de su entorno.
    -   *3º Grado:* Resuelve de manera colaborativa situaciones sencillas que involucran números y que implican juntar, agregar, separar o quitar elementos.

---

## 🚀 Cómo Ejecutar el Proyecto Localmente

Este proyecto está construido con tecnologías web estándar (**HTML5, CSS3 y JavaScript Vanilla**). Es 100% autónomo y no requiere servidores locales ni bases de datos.

1.  Descarga el repositorio en tu computadora.
2.  Haz doble clic en el archivo `index.html` para abrirlo en tu navegador favorito (Chrome, Edge, Firefox, Safari, etc.).
3.  ¡Listo! Puedes empezar a configurar los jugadores y jugar de inmediato.

---

## 🛠️ Tecnologías Utilizadas

*   **HTML5** para la estructura del tablero y pantallas.
*   **CSS3 (Vanilla)** para el diseño de interfaces responsivas, sistema de colores y efectos visuales adaptados a niños.
*   **JavaScript (ES6)** para controlar la lógica del flujo de turnos, validación de fichas, mezclas y efectos dinámicos en Canvas.
*   **FontAwesome CDN** para los iconos interactivos de la interfaz.
*   **Google Fonts** (Fuentes *Fredoka* y *Quicksand* para una estética redondeada e infantil).

---

## 📂 Estructura de Archivos

```text
/
├── index.html      # Estructura del juego y vistas principales
├── style.css       # Hoja de estilos con diseño infantil responsivo
├── app.js          # Lógica completa y sistema de confeti
└── README.md       # Documentación del proyecto (este archivo)
```
