import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import CocheSVG from './CocheSVG'
import { useEffect, useState } from 'react'
import { Client } from '@stomp/stompjs'

function EvtClickMapa ({ onClick }) {
  useMapEvents({
    click (e) {
      onClick(e.latlng)
    }
  })
}

export default function App () {
  const position = [51.505, -0.09]

  const [posicionCoche, setPosicionCoche] = useState([0, 0])
  const [posicionAnterior, setPosicionAnterior] = useState([0, 0])
  const [anguloCoche, setAnguloCoche] = useState(0)

  useEffect(() => {
    const cliente = new Client({
      brokerURL: 'ws://localhost:8080/websocket'
    })
    cliente.onConnect = () => {
      console.log('Conectado')
      cliente.subscribe('/taxi/coordenada', (m) => {
        const coordenada = JSON.parse(m.body)

        const puntoNuevo = [coordenada.x, coordenada.y]
        const anguloNuevo = calcularAnguloDireccionGPS(posicionAnterior, puntoNuevo)
        setPosicionAnterior(puntoNuevo)
        setPosicionCoche([coordenada.x, coordenada.y])
        setAnguloCoche(anguloNuevo)
      })
    }
    cliente.activate()
    return () => {
      if (cliente) {
        cliente.deactivate()
      }
    }
  }, [posicionAnterior])

  const svgIconoCoche = L.divIcon({
    html: `<div class='svg-icon' style="transform: rotate(${anguloCoche}deg);">${CocheSVG}</div>`,
    className: 'svg-icon'
  })

  const calcularAnguloDireccionGPS = (puntoAnterior, puntoNuevo) => {
    const [lat1, lon1] = puntoAnterior
    const [lat2, lon2] = puntoNuevo
    console.log(puntoAnterior, puntoNuevo)

    const deltaX = lat2 - lat1
    const deltaY = lon2 - lon1
    const anguloRad = Math.atan2(deltaY, deltaX)
    const anguloGrados = (anguloRad * 180) / Math.PI
    return anguloGrados
  }

  return (
    <MapContainer center={position} zoom={13} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      <EvtClickMapa onClick={(c) => console.log('coordenadas.add(new Coordenada(' + c.lat + ', ' + c.lng + '));')} />
      <Marker position={posicionCoche} icon={svgIconoCoche} />
    </MapContainer>
  )
}
