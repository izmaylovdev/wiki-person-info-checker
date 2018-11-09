const getReqularExprForFieldExec = (fieldName: string) => new RegExp(`${fieldName} = {{(.*?)}}`, 'mi');

export default function getFieldFromWikiPageContent(pageContent: string, fieldName: string): string | null {
    const reg: RegExp = getReqularExprForFieldExec(fieldName);
    const match = pageContent.match(reg);
    const fieldValue = match && match[1];

    return fieldValue;
}
