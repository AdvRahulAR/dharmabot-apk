export async function POST(request: Request) {
  try {
    const { content, title } = await request.json();
    
    // For now, return a simple text response since DOCX generation requires server-side libraries
    // In a full implementation, you would use the 'docx' library here to generate a proper DOCX file
    
    const response = new Response(content, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${title || 'document'}.docx"`,
      },
    });
    
    return response;
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to export document' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}