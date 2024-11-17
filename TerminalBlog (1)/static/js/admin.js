document.addEventListener('DOMContentLoaded', () => {
    const editor = new Quill('#editor', {
        theme: 'snow',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{ 'header': 1 }, { 'header': 2 }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'script': 'sub'}, { 'script': 'super' }],
                ['link', 'image'],
                ['clean']
            ]
        }
    });

    const postForm = document.getElementById('post-form');
    if (postForm) {
        postForm.onsubmit = function() {
            const content = document.querySelector('input[name=content]');
            content.value = editor.root.innerHTML;
            return true;
        };
    }
});
