#!/usr/bin/env python3
"""Reconstrucción de JSON/CSV públicos desde 02_MEGABASE_IMEF_V4.xlsx.
No crea investigaciones, no asigna puntajes ni publica un sitio.
Requiere artifact_tool en el entorno de Python.
"""
import argparse,copy,csv,json,re,pathlib,collections,sys
from artifact_tool import Blob,SpreadsheetFile

def read(wb,name,row=4):
    sheet=wb.worksheets.get_item(name)
    matrix=sheet.get_range(f'A{row}').get_current_region().values
    cols=[str(x or '').strip() for x in matrix[0]]
    return [dict(zip(cols,r)) for r in matrix[1:] if r and r[0]]

def need(b,message):
    if not b:raise ValueError(message)

def main():
    arg=argparse.ArgumentParser()
    arg.add_argument('--master',default='02_MEGABASE_IMEF_V4.xlsx')
    arg.add_argument('--site',default='.')
    args=arg.parse_args()
    wb=SpreadsheetFile.import_xlsx(Blob.load(args.master));site=pathlib.Path(args.site)
    t={name:read(wb,name) for name in ['LINEAS','PROPUESTAS','PREGUNTAS','RELACIONES','TEMAS_ESP','PROBLEMAS','SECTORES','ENLACES_HIST','CONTROL_AE','RUBRICA']}
    aliases={x['ID V3 en preguntas']:x['ID canónico V4'] for x in read(wb,'ALIAS_FUENTES',1)}
    legacy={x['PROP']:x for x in read(wb,'ALIAS_LEGADO',1)}
    fs=read(wb,'FUENTES_V4',1)
    ft={"ID":"id","Autor/organismo":"autor","Fecha":"fecha","Título":"titulo","URL":"url","Tipo":"tipo","Uso":"uso","Límite":"limite","Consulta":"consulta","Origen":"origen","Acceso":"acceso_v4","APA7":"referencia_apa7"}
    sources=[{ft[k]:v for k,v in x.items() if k in ft} for x in fs]
    props=copy.deepcopy(t['PROPUESTAS'])
    for p in props:
        old=legacy.get(p['id_propuesta'])
        p.update({'id_problema_v3':old['PROB ID V3'] if old else None,
                  'id_sector_v3':old['SEC ID V3'] if old else None,
                  'titulo_v3_verificado':(p['titulo_original']==old['Título preservado']) if old else None,
                  'estado_publicacion':'pendiente_autorizacion_docente',
                  'estado_causal_validado':False,'folio_historico_verificado_en_v1':None})
    kys=[('LINEAS','id_linea'),('PROPUESTAS','id_propuesta'),('PREGUNTAS','id_pregunta'),('RELACIONES','id_relacion'),('TEMAS_ESP','id_tema_especifico'),('PROBLEMAS','id_problema'),('SECTORES','id_sector')]
    for name,k in kys:need(len({x[k] for x in t[name]})==len(t[name]),f'ID duplicado {name}.{k}')
    pids={p['id_propuesta'] for p in props};q={x['id_pregunta']:x for x in t['PREGUNTAS']};sectors={x['id_sector'] for x in t['SECTORES']}
    for r in t['RELACIONES']:
        need(r['id_propuesta'] in pids and r['id_pregunta'] in q and r['id_sector'] in sectors,'Relación huérfana')
        need(q[r['id_pregunta']]['id_propuesta']==r['id_propuesta'] and q[r['id_pregunta']]['alcance']==r['alcance'],'Pregunta o alcance incompatible')
    need(len([x for x in props if x['ejecutiva']])==12,'Debe conservar exactamente 12 ejecutivas')
    need(len([x for x in props if x['id_propuesta'] in legacy])==36,'Debe conservar 36 propuestas legadas')
    need(all('habilitada' not in str(x['estado_causal']).lower() or 'no habilitada' in str(x['estado_causal']).lower() for x in t['RELACIONES']),'Causalidad marcada como habilitada')
    counts={
        'n_temas_generales':len(t['LINEAS']),'n_temas_especificos':len(t['TEMAS_ESP']),'n_problemas_unicos':len(t['PROBLEMAS']),
        'n_preguntas_descriptivas_unicas':sum(x['alcance']=='DES' for x in t['PREGUNTAS']),
        'n_preguntas_causales_candidatas_unicas':sum(x['alcance']=='CAU' for x in t['PREGUNTAS']),
        'n_preguntas_totales':len(t['PREGUNTAS']),
        'n_propuestas_unicas':len(props),'n_propuestas_legacy_36':len(legacy),
        'n_propuestas_recuperadas_historico':sum('Rescate' in (x['origen'] or '') for x in props),
        'n_propuestas_expansion_nueva':sum('Expansión' in (x['origen'] or '') for x in props),
        'n_rutas_navegables_validas':len(t['RELACIONES']),
        'n_rutas_descriptivas':sum(x['alcance']=='DES' for x in t['RELACIONES']),
        'n_rutas_causales_no_habilitadas':sum(x['alcance']=='CAU' for x in t['RELACIONES']),
        'n_sectores':len(t['SECTORES']),'n_escogidas_ejecutivas':sum(bool(x['ejecutiva']) for x in props),
        'n_fuentes_maestras_v4':len(sources),'n_enlaces_historicos_verificados_por_ids':len(t['ENLACES_HIST']),
        'n_folios_historicos_originales':5270,'n_descartes_historicos_originales':2730,
        'n_historicos_no_incorporados_v4':4523,'n_registros_descartes_y_reservas_total':7265,'n_controles_negativos':12,
        'n_validaciones_causales':0,'n_revisadas_metodologicamente_externas':0,
        'n_aprobadas_institucionalmente':0,'n_autorizadas_difusion':0,'n_pendientes_revision_docente':len(props)}
    def public(c):return c if str(c.get('url') or '').startswith(('http://','https://')) else None
    output={'schema_version':'4.0.0','version_contenido':'V4-01-investigacion','version_interfaz':'V4.0',
      'fecha_corte':'2026-11-04','estado_institucional':'Propuesta preliminar. Sin autorización docente de difusión ni aprobación del IMEF Yucatán.',
      'metodo_registro':'Propuestas y preguntas únicas; rutas no equivalen a estudios nuevos.',
      'avisos':['Candidatas causales no habilitadas','189 familias históricas pendientes de revisión individual','No publicar sin permiso docente'],
      'counts':counts,'lineas':t['LINEAS'],'temas_especificos':t['TEMAS_ESP'],'problemas':t['PROBLEMAS'],
      'preguntas':t['PREGUNTAS'],'sectores':t['SECTORES'],'propuestas':props,'relaciones':t['RELACIONES'],
      'fuentes':[x for x in (public(x) for x in sources) if x],
      'fuentes_alias_v3':aliases,'rubrica':t['RUBRICA'],
      'metodologia':{'criterios':'A IMEF; B Facultad; C Yucatán; D Científico; E Datos','nota':'Puntajes V1 en 36; no asignar nuevos sin calibrar.'},
      'historia_resumen':{'historico_2026':5270,'descartes_2026':2730,'recuperados_enlaces':len(t['ENLACES_HIST']),'no_incorporados':4523},
      'validaciones':{'integridad_examen':'comprobado automáticamente','revision_cientifica_individual':'pendiente','validacion_profesor':'pendiente','publicacion_autorizada':False}}
    (site/'data').mkdir(parents=True,exist_ok=True);(site/'downloads').mkdir(exist_ok=True)
    (site/'data/catalogo_v4.json').write_text(json.dumps(output,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    (site/'data/manifest_v4.json').write_text(json.dumps({'schema_version':'4.0.0','version':'V4.0','date':'2026-11-04','counts':counts,'publication_authorized':False,'master':str(args.master),'data':'catalogo_v4.json','status':'preliminar; revisión docente pendiente'},ensure_ascii=False,indent=2),encoding='utf-8')
    qq=collections.defaultdict(dict)
    for x in t['PREGUNTAS']:qq[x['id_propuesta']][x['alcance']]=x
    cols=['id_propuesta','id_linea','tema_general','tema_especifico','problema','titulo_original','sector_original','territorio','variables_originales','pregunta_descriptiva','pregunta_causal_candidata','estado_factibilidad_causal','puntaje_v1','ejecutiva','origen','estado_publicacion']
    with (site/'downloads/02_CATALOGO_PRELIMINAR_V4.csv').open('w',encoding='utf-8-sig',newline='') as f:
        w=csv.DictWriter(f,fieldnames=cols);w.writeheader()
        for p in props:
            z={k:p.get(k) for k in cols};z['pregunta_descriptiva']=qq[p['id_propuesta']]['DES']['texto_base'];z['pregunta_causal_candidata']=qq[p['id_propuesta']].get('CAU',{}).get('texto_base','');z['estado_factibilidad_causal']=qq[p['id_propuesta']].get('CAU',{}).get('estado_factibilidad','No formulada');w.writerow(z)
    print(json.dumps(counts,ensure_ascii=False,indent=2))
    print('JSON y CSV reconstruidos. Regenera y vuelve a cotejar los PDF ANTES de publicar una modificación.')
if __name__=='__main__':main()
