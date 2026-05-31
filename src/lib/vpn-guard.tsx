/**
 * NOTA: AnyConnect usa full-tunnel — quando a VPN está ON, todo tráfego fora
 * da intranet é bloqueado (inclusive este app), e quando está OFF, qualquer
 * probe do navegador para a intranet também falha. Não dá pra detectar o
 * estado da VPN de forma confiável a partir do navegador. Por isso, o guard
 * apenas abre o link diretamente — cabe ao usuário ter a VPN conectada.
 */
export async function guardIntranet(open: () => void, _label = "este link") {
  open();
}
