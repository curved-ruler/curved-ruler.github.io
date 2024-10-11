
#include <iostream>
#include <string>

#define STB_IMAGE_IMPLEMENTATION
#include <stb/stb_image.h>
#define STB_IMAGE_WRITE_IMPLEMENTATION
#include <stb/stb_image_write.h>
#define STB_IMAGE_RESIZE_IMPLEMENTATION
#include <stb/stb_image_resize2.h>

int main (int argc, char** argv)
{
    std::string s = argv[1];
    size_t sn = s.size();
    if (s.size() < 4 || (s[sn-3] != 'p' || s[sn-2] != 'n' || s[sn-1] != 'g'))
    {
        std::cout << "Not processing: " << argv[1] << std::endl;
        return -1;
    }
    
    int w, h, ch;
    unsigned char* im = stbi_load(argv[1], &w, &h, &ch, 0);
    if (stbi_failure_reason())
    {
        std::cout << "Stbi Error on file: " << argv[1] << "    " << stbi_failure_reason() << std::endl;
        return -3;
    }
    
    int w2 = 180;
    int h2 = (180*h)/w;
    unsigned char* output = new unsigned char[w2*h2*ch];
    
    if (ch == 1)
    {
        stbir_resize_uint8_srgb( im,       w,  h,  w*ch,
                                 output,  w2, h2, w2*ch,
                                 STBIR_1CHANNEL );
    }
    else if (ch == 2)
    {
        stbir_resize_uint8_srgb( im,       w,  h,  w*ch,
                                 output,  w2, h2, w2*ch,
                                 STBIR_RA );
    }
    else if (ch == 3)
    {
        stbir_resize_uint8_srgb( im,       w,  h,  w*ch,
                                 output,  w2, h2, w2*ch,
                                 STBIR_RGB );
    }
    else if (ch == 4)
    {
        stbir_resize_uint8_srgb( im,       w,  h,  w*ch,
                                 output,  w2, h2, w2*ch,
                                 STBIR_RGBA );
    }
    else
    {
        std::cout << "CH err: " << ch << "  at " << argv[1] << std::endl;
        return -3;
    }
    
    stbi_write_png(argv[2], w2, h2, ch, output, w2*ch);
    
    delete[] output;
}
