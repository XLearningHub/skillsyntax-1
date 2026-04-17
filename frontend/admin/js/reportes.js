// js/reportes.js

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("graficaUsuarios")) {
        cargarGraficaUsuarios();
        cargarGraficaHabilidades();
    }
});


const coloresGrafica = [
    "#00c2cb", 
    "#9b5de5", 
    "#f15bb5", 
    "#fee440", 
    "#00bbf9", 
    "#00f5d4", 
    "#ff7043", 
];


const opcionesComunes = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                color: '#a0aec0', 
                font: { family: 'Inter', size: 12, weight: '500' },
                padding: 25,
                usePointStyle: true,
                pointStyle: 'circle'
            }
        },
        tooltip: {
            backgroundColor: '#0d1b2e',
            titleFont: { family: 'Inter', size: 14 },
            bodyFont: { family: 'Inter', size: 13 },
            padding: 12,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            displayColors: true
        }
    }
};

// GRÁFICA DE BARRAS
async function cargarGraficaUsuarios() {
    try {
        const res = await fetch("http://localhost:3000/api/resultados/reporte-usuarios");
        const data = await res.json();
        const nombres = data.map(d => d.usuario);
        const totales = data.map(d => d.total);

        new Chart(document.getElementById("graficaUsuarios"), {
            type: "bar",
            data: {
                labels: nombres,
                datasets: [{
                    label: "Ejercicios",
                    data: totales,
                    backgroundColor: coloresGrafica, 
                    borderRadius: 8,
                    hoverOpacity: 0.8
                }]
            },
            options: {
                ...opcionesComunes,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                        ticks: { color: '#a0aec0' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#a0aec0' }
                    }
                }
            }
        });
    } catch (error) {
        console.error("Error gráfica usuarios:", error);
    }
}

// GRÁFICA DE DONA (
async function cargarGraficaHabilidades() {
    try {
        const res = await fetch("http://localhost:3000/api/resultados/reporte-habilidades");
        const data = await res.json();
        const habilidades = data.map(d => d.habilidad);
        const totales = data.map(d => d.total);

        new Chart(document.getElementById("graficaHabilidades"), {
            type: "doughnut",
            data: {
                labels: habilidades,
                datasets: [{
                    data: totales,
                    backgroundColor: coloresGrafica, 
                    borderWidth: 2,
                    borderColor: "#0d1b2e", 
                    hoverOffset: 20,
                    cutout: '70%'
                }]
            },
            options: {
                ...opcionesComunes,
                plugins: {
                    ...opcionesComunes.plugins,
                    legend: {
                        ...opcionesComunes.plugins.legend,
                        position: 'right' 
                    }
                }
            }
        });
    } catch (error) {
        console.error("Error gráfica habilidades:", error);
    }
}