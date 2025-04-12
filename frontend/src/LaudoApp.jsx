// Interface com login, cadastro, upload de áudio, exportação em PDF e histórico real
import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectItem } from "@/components/ui/select"
import jsPDF from "jspdf"

export default function LaudoApp() {
  const [audioFile, setAudioFile] = useState(null)
  const [tipoExame, setTipoExame] = useState("US Abdome Total")
  const [laudo, setLaudo] = useState("")
  const [transcricao, setTranscricao] = useState("")
  const [historico, setHistorico] = useState([])
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [token, setToken] = useState(localStorage.getItem("token") || "")
  const [modoCadastro, setModoCadastro] = useState(false)

  useEffect(() => {
    if (token) carregarHistorico()
  }, [token])

  const autenticar = async () => {
    const rota = modoCadastro ? 'registro' : 'login'
    const res = await fetch(`http://localhost:5000/${rota}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    })
    const data = await res.json()
    if (data.token) {
      setToken(data.token)
      localStorage.setItem("token", data.token)
    } else {
      alert(data.msg || (modoCadastro ? "Cadastro falhou" : "Login falhou"))
    }
  }

  const carregarHistorico = async () => {
    const res = await fetch('http://localhost:5000/historico', {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    setHistorico(data)
  }

  const handleUpload = async () => {
    if (!audioFile) return
    setLoading(true)
    const formData = new FormData()
    formData.append('audio', audioFile)
    formData.append('template', tipoExame)

    try {
      const res = await fetch('http://localhost:5000/laudo', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()
      setLaudo(data.laudo)
      setTranscricao(data.transcricao)
      carregarHistorico()
    } catch (err) {
      alert("Erro ao gerar laudo")
    } finally {
      setLoading(false)
    }
  }

  const exportarPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(12)
    doc.text("Laudo Médico", 10, 10)
    doc.text("Tipo de Exame: " + tipoExame, 10, 20)
    doc.text("Transcrição:", 10, 30)
    doc.text(transcricao || "-", 10, 40, { maxWidth: 180 })
    doc.text("Laudo:", 10, 90)
    doc.text(laudo || "-", 10, 100, { maxWidth: 180 })
    doc.save("laudo_medico.pdf")
  }

  const exames = [
    "TC Crânio", "TC Tórax", "TC Abdome e Pelve", "TC Coluna Lombar", "TC Seios Paranasais",
    "US Abdome Total", "US Tireoide", "US Pélvica", "US Próstata Via Abdominal", "US Renal", "US Bolsa Escrotal",
    "RM Encéfalo", "RM Coluna Lombar", "RM Joelho", "RM Ombro", "RM Abdome Superior"
  ]

  if (!token) {
    return (
      <div className="p-6 max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-bold">{modoCadastro ? "Cadastro" : "Login"}</h1>
        <input type="email" placeholder="Email" className="border p-2 w-full" onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Senha" className="border p-2 w-full" onChange={(e) => setSenha(e.target.value)} />
        <Button onClick={autenticar}>{modoCadastro ? "Cadastrar" : "Entrar"}</Button>
        <p className="text-sm cursor-pointer text-blue-600 underline" onClick={() => setModoCadastro(!modoCadastro)}>
          {modoCadastro ? "Já tem conta? Faça login" : "Não tem conta? Cadastre-se"}
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">RadIA - Gerador de Laudos com IA</h1>
        <Button variant="outline" onClick={() => {
          localStorage.removeItem("token")
          setToken("")
        }}>Logout</Button>
      </div>

      <div className="flex flex-col space-y-2">
        <label className="text-sm">Selecione o tipo de exame:</label>
        <Select value={tipoExame} onValueChange={setTipoExame}>
          {exames.map((exame) => (
            <SelectItem key={exame} value={exame}>{exame}</SelectItem>
          ))}
        </Select>
      </div>

      <input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files[0])} />

      <div className="flex space-x-2">
        <Button onClick={handleUpload} disabled={loading}>
          {loading ? "Processando..." : "Gerar Laudo"}
        </Button>
        {laudo && (
          <Button onClick={exportarPDF} variant="secondary">Exportar PDF</Button>
        )}
      </div>

      {transcricao && (
        <Card><CardContent className="p-4">
          <h2 className="text-lg font-semibold">Transcrição:</h2>
          <p className="whitespace-pre-wrap text-sm">{transcricao}</p>
        </CardContent></Card>
      )}

      {laudo && (
        <Card><CardContent className="p-4">
          <h2 className="text-lg font-semibold">Laudo Gerado:</h2>
          <p className="whitespace-pre-wrap text-sm">{laudo}</p>
        </CardContent></Card>
      )}

      {historico.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Histórico de Laudos</h2>
          {historico.map((item, idx) => (
            <Card key={idx}><CardContent className="p-4">
              <p className="text-sm font-semibold">{item.tipo}</p>
              <p className="text-xs text-gray-600">{item.transcricao}</p>
              <p className="text-sm whitespace-pre-wrap mt-2">{item.laudo}</p>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  )
}
