
// Add this to your server/routes.ts file for testing
app.get('/api/test/projects', (req, res) => {
  res.json({
    success: true,
    projects: [
  {
    "id": 1,
    "name": "Project 1",
    "description": "First content",
    "type": "video",
    "tags": [
      "video",
      "content"
    ],
    "createdAt": "2025-12-23T16:58:09.306Z"
  },
  {
    "id": 2,
    "name": "Project 2",
    "description": "Second project",
    "type": "campaign",
    "tags": [
      "campaign",
      "marketing"
    ],
    "createdAt": "2025-12-23T16:58:09.307Z"
  }
]
  });
});

app.get('/api/test/projects/:id', (req, res) => {
  const projectId = parseInt(req.params.id);
  const project = [{"id":1,"name":"Project 1","description":"First content","type":"video","tags":["video","content"],"createdAt":"2025-12-23T16:58:09.306Z"},{"id":2,"name":"Project 2","description":"Second project","type":"campaign","tags":["campaign","marketing"],"createdAt":"2025-12-23T16:58:09.307Z"}].find(p => p.id === projectId);
  
  if (project) {
    res.json({
      success: true,
      project: project
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }
});

app.get('/api/test/projects/:id/content', (req, res) => {
  const projectId = parseInt(req.params.id);
  const content = [{"id":1,"title":"Sample Video Content","description":"This is a test video content for Project 1","platform":"youtube","contentType":"video","status":"draft","projectId":1,"createdAt":"2025-12-23T16:58:09.307Z"},{"id":2,"title":"Instagram Post","description":"Test Instagram post for Project 1","platform":"instagram","contentType":"post","status":"published","projectId":1,"createdAt":"2025-12-23T16:58:09.307Z"},{"id":3,"title":"Facebook Campaign","description":"Marketing campaign for Project 2","platform":"facebook","contentType":"campaign","status":"scheduled","projectId":2,"createdAt":"2025-12-23T16:58:09.307Z"}].filter(c => c.projectId === projectId);
  
  res.json({
    success: true,
    content: content,
    total: content.length,
    projectId: projectId
  });
});
  