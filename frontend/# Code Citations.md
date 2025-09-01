# Code Citations

## License: unknown
https://github.com/nitzanmaizel/ToDoApp-Nitzan-Server/blob/e86e630ae1165096410950204065a798dd6c5ace/routes/task.js

```
(req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description
```

