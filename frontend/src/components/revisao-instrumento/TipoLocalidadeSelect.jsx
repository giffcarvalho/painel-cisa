import { useEffect, useId, useRef, useState } from 'react'
import Select, { components, createFilter } from 'react-select'
import { Popover } from 'radix-ui'
import { Info } from 'lucide-react'
import comunidadesTradicionais from '@/utils/tiposLocalidade'
import styles from './TipoLocalidadeSelect.module.css'

const opcoes = comunidadesTradicionais.map(({ nome, descricao }) => ({
  value: nome, label: nome, descricao,
}))
const filtrar = createFilter({ ignoreAccents: true, ignoreCase: true, stringify: ({ label }) => label })

function InformacaoTipo({ opcao }) {
  const [aberto, setAberto] = useState(false)
  const fechamento = useRef(null)
  useEffect(() => () => clearTimeout(fechamento.current), [])
  const abrir = () => {
    clearTimeout(fechamento.current)
    setAberto(true)
  }
  const fechar = () => {
    fechamento.current = setTimeout(() => setAberto(false), 150)
  }
  return (
    <Popover.Root open={aberto} onOpenChange={setAberto}>
      <Popover.Trigger asChild>
        <button type="button" className={styles.info}
          aria-label={`Informações sobre ${opcao.label}`}
          onMouseEnter={abrir}
          onMouseLeave={fechar}
          onFocus={abrir}
          onBlur={fechar}
          // Mantém o foco do combobox e impede a seleção ao consultar a descrição.
          onMouseDown={(event) => { event.preventDefault(); event.stopPropagation() }}
          onClick={(event) => { event.preventDefault(); event.stopPropagation(); abrir() }}>
          <Info size={15} aria-hidden="true" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className={styles.descricao} side="right" sideOffset={6}
          collisionPadding={12} aria-label={`Descrição de ${opcao.label}`}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onMouseEnter={abrir} onMouseLeave={fechar}
          onFocus={abrir} onBlur={fechar}>
          {opcao.descricao}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

function OpcaoTipo(props) {
  return (
    <components.Option {...props}>
      <div className={styles.opcao}>
        <span>{props.data.label}</span>
        <InformacaoTipo opcao={props.data} />
      </div>
    </components.Option>
  )
}

const estilosSelect = {
  control: (base) => ({ ...base, minHeight: 32, borderColor: '#cbd5e1', boxShadow: 'none' }),
  valueContainer: (base) => ({ ...base, padding: '2px 6px' }),
  singleValue: (base) => ({ ...base, whiteSpace: 'normal', overflowWrap: 'anywhere' }),
  option: (base) => ({ ...base, whiteSpace: 'normal', padding: '8px', color: '#334155' }),
  menu: (base) => ({ ...base, width: '100%' }),
  menuPortal: (base) => {
    const largura = Math.min(320, window.innerWidth - 24)
    return { ...base, zIndex: 1100, width: largura,
      left: Math.max(12, Math.min(base.left, window.innerWidth - largura - 12)),
      fontSize: 12, fontFamily: 'Rawline, system-ui, sans-serif' }
  },
  dropdownIndicator: (base) => ({ ...base, padding: 4 }),
  clearIndicator: (base) => ({ ...base, padding: 4 }),
}

export default function TipoLocalidadeSelect({ value, onChange, disabled = false }) {
  const id = useId()
  const selecionada = opcoes.find((opcao) => opcao.value === value) ?? null
  return (
    <div className={styles.campo}>
      <Select instanceId={id} inputId={id} aria-label="Tipo de Localidade"
        options={opcoes} value={selecionada} onChange={(opcao) => onChange(opcao?.value ?? null)}
        isDisabled={disabled} isClearable isSearchable filterOption={filtrar}
        placeholder="Selecionar tipo" noOptionsMessage={() => 'Nenhuma classificação encontrada'}
        menuPortalTarget={document.body} menuPosition="fixed" menuPlacement="auto"
        maxMenuHeight={260} tabSelectsValue={false} styles={estilosSelect}
        components={{ Option: OpcaoTipo }} />
      {selecionada && <InformacaoTipo opcao={selecionada} />}
    </div>
  )
}
