document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('fileInput');
    const imagesContainer = document.getElementById('imagesContainer');
  
    // Handle form submission
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData();
      formData.append('image', fileInput.files[0]);
      
      try {
        const response = await fetch('/upload', {
          method: 'POST',
          body: formData
        });
        const result = await response.json();
        alert(result.message);
        fetchImages();
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    });
  
    // Fetch and display images
    const fetchImages = async () => {
      try {
        const response = await fetch('/images');
        const imageUrls = await response.json();
        imagesContainer.innerHTML = '';
        imageUrls.forEach(url => {
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.target = '_blank';
          anchor.rel = 'noopener noreferrer';
          
          const img = document.createElement('img');
          img.src = url;
          img.alt = 'Uploaded Image';
          img.className = 'w-full h-full object-cover rounded-lg';
  
          anchor.appendChild(img);
          imagesContainer.appendChild(anchor);
        });
      } catch (error) {
        console.error('Error fetching images:', error);
      }
    };
  
    // Initial fetch of images
    fetchImages();
  });
  